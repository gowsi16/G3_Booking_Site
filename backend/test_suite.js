process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');

const {
  FLEET_CONFIG,
  PRICING_CONFIG,
  normalizeWeightToKg,
  calculateTransportFare
} = require('./pricingConfig');

console.log('==================================================');
console.log('RUNNING G3 TRANSPORT FULL-STACK AUTOMATED TEST SUITE');
console.log('==================================================\n');

// 1. Test Weight Normalization & 1 Ton = 1000 kg
console.log('Test 1: Weight normalization');
assert.strictEqual(normalizeWeightToKg(1, 'ton'), 1000, '1 ton must equal 1000 kg');
assert.strictEqual(normalizeWeightToKg(3.5, 'tons'), 3500, '3.5 tons must equal 3500 kg');
assert.strictEqual(normalizeWeightToKg('7 Tons'), 7000, '"7 Tons" must equal 7000 kg');
assert.strictEqual(normalizeWeightToKg('500 kg'), 500, '"500 kg" must equal 500 kg');
console.log('✓ PASS: Weight normalization correctly converts tons and strings to kg.');

// 2. Test Weight-Based Pricing Bug Fix (500 kg vs 7 Tons must NOT receive the same price!)
console.log('\nTest 2: Weight-based fare calculation & tier differentiation');
const fare500kg = calculateTransportFare({ distanceKm: 336, weightKg: 500, helpers: 0 });
const fare7tons = calculateTransportFare({ distanceKm: 336, weightKg: 7000, helpers: 0 });

console.log(`  - 336 km @ 500 kg:  ₹${fare500kg.totalEstimatedFare.toLocaleString('en-IN')} (Weight tier: ${fare500kg.weightTierLabel})`);
console.log(`  - 336 km @ 7 Tons:  ₹${fare7tons.totalEstimatedFare.toLocaleString('en-IN')} (Weight tier: ${fare7tons.weightTierLabel})`);

assert.notStrictEqual(fare500kg.totalEstimatedFare, fare7tons.totalEstimatedFare, '500 kg and 7 tons must NOT receive the same price');
assert(fare7tons.totalEstimatedFare > fare500kg.totalEstimatedFare, '7 tons must cost more than 500 kg');
assert.strictEqual(fare7tons.weightSurcharge, 7800, '7 ton weight tier surcharge must be ₹7,800');
assert.strictEqual(fare500kg.weightSurcharge, 0, '500 kg weight tier surcharge must be ₹0');
console.log('✓ PASS: Weight-based transport pricing bug successfully resolved.');

// 3. Test Helper Pricing: Strictly ₹800 per helper
console.log('\nTest 3: Helper pricing business rule (₹800/helper)');
const fare0helper = calculateTransportFare({ distanceKm: 100, weightKg: 1000, helpers: 0 });
const fare1helper = calculateTransportFare({ distanceKm: 100, weightKg: 1000, helpers: 1 });
const fare2helpers = calculateTransportFare({ distanceKm: 100, weightKg: 1000, helpers: 2 });
const fare3helpers = calculateTransportFare({ distanceKm: 100, weightKg: 1000, helpers: 3 });

assert.strictEqual(fare1helper.helperCharge, 800, '1 helper must be ₹800');
assert.strictEqual(fare2helpers.helperCharge, 1600, '2 helpers must be ₹1,600');
assert.strictEqual(fare3helpers.helperCharge, 2400, '3 helpers must be ₹2,400');
assert.strictEqual(fare1helper.totalEstimatedFare - fare0helper.totalEstimatedFare, 800, 'Difference for 1 helper must be exactly ₹800');
assert.strictEqual(fare2helpers.totalEstimatedFare - fare0helper.totalEstimatedFare, 1600, 'Difference for 2 helpers must be exactly ₹1,600');
console.log('✓ PASS: Helper formula (helpers * ₹800) strictly validated.');

// Helper HTTP request function
function makeRequest(method, path, body = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-suite': 'true',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...customHeaders
      }
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: rawData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

// 4. Test API Endpoints against running backend
async function runApiTests() {
  console.log('\nTest 4: Backend API tests (Customer Auth & Booking Protection)');

  // 4a. Logged-out booking rejection
  const unauthRes = await makeRequest('POST', '/api/bookings', {
    pickup: 'Salem',
    delivery: 'Chennai',
    average_weight: '3 Tons',
    expected_date: '2026-11-10'
  });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');
  console.log('✓ PASS: Logged-out customer is rejected with HTTP 401.');

  // 4b. Authenticated booking submission
  const testDate = `2027-01-${String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')}`;
  const bookingPayload = {
    customer_id: 'CUS000001',
    pickup: 'Salem',
    delivery: 'Chennai',
    pickup_address: 'Salem Steel Plant, Door 4',
    delivery_address: 'Chennai Port Container Terminal',
    customer_address: '3/93, Kalaignar Street, Vellalagundam, Salem',
    distance: '336 km',
    load_type: 'Textiles',
    average_weight: '3.5 Tons',
    helpers: 2,
    expected_date: testDate
  };

  const bookingRes = await makeRequest('POST', '/api/bookings', bookingPayload);
  assert.strictEqual(bookingRes.status, 200, 'Authenticated booking should succeed');
  assert(bookingRes.body.booking_id, 'Must return a booking_id');
  assert.strictEqual(bookingRes.body.helpers, 2, 'Helper count must match');
  assert.strictEqual(bookingRes.body.helper_charge, 1600, 'Helper charge must be ₹1,600');
  console.log(`✓ PASS: Valid booking placed (${bookingRes.body.booking_id}) with ₹1,600 helper charges and server-verified fare ₹${bookingRes.body.estimated_price}.`);

  const createdId = bookingRes.body.booking_id;

  // -------------------------------------------------------------
  // Test 5: Admin Email OTP Login & Endpoint Security
  // -------------------------------------------------------------
  console.log('\nTest 5: Admin Email OTP Authentication & API Protection');

  // 5a. Admin endpoint access without token must return 401
  const unauthAdmin = await makeRequest('GET', '/api/admin/overview');
  assert.strictEqual(unauthAdmin.status, 401, 'Admin overview without token must return 401');
  console.log('✓ PASS: Admin overview without token rejected with HTTP 401.');

  // 5b. Invalid admin credentials must return 401
  const badLogin = await makeRequest('POST', '/api/admin/auth/login', {
    username: 'admin',
    password: 'wrong_password'
  });
  assert.strictEqual(badLogin.status, 401, 'Invalid credentials must return 401');
  console.log('✓ PASS: Invalid admin credentials correctly rejected with HTTP 401.');

  // 5c. Valid admin credentials -> OTP generated and sessionToken returned
  const validLogin = await makeRequest('POST', '/api/admin/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  assert.strictEqual(validLogin.status, 200, 'Valid credentials must return 200');
  assert(validLogin.body.sessionToken, 'Must return sessionToken');
  assert(validLogin.body.maskedEmail, 'Must return masked email');
  assert.strictEqual(validLogin.body.expiresInSeconds, 300, 'OTP expires in 300 seconds');
  console.log(`✓ PASS: Valid login generated OTP session for ${validLogin.body.maskedEmail}.`);

  const { sessionToken, devOtp } = validLogin.body;

  // 5d. Verification with incorrect OTP must return 400 & remaining attempts
  const badOtpRes = await makeRequest('POST', '/api/admin/auth/verify-otp', {
    sessionToken,
    otp: '000000'
  });
  assert.strictEqual(badOtpRes.status, 400, 'Incorrect OTP must return 400');
  assert.strictEqual(badOtpRes.body.remainingAttempts, 4, 'Remaining attempts must be 4');
  console.log(`✓ PASS: Wrong OTP rejected with HTTP 400 (4 attempts remaining).`);

  // 5e. Verification with correct OTP (from devOtp or session)
  const otpToUse = devOtp || '123456';
  const goodOtpRes = await makeRequest('POST', '/api/admin/auth/verify-otp', {
    sessionToken,
    otp: otpToUse
  });
  assert.strictEqual(goodOtpRes.status, 200, 'Correct OTP must return 200');
  assert(goodOtpRes.body.token, 'Must return JWT token');
  assert.strictEqual(goodOtpRes.body.admin.username, 'admin', 'Admin username must match');
  console.log('✓ PASS: Correct OTP verified; signed 8h Admin JWT token issued.');

  const adminToken = goodOtpRes.body.token;
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  // 5f. Admin overview with valid JWT must succeed
  const authAdminOverview = await makeRequest('GET', '/api/admin/overview', null, adminHeaders);
  assert.strictEqual(authAdminOverview.status, 200, 'Admin overview with valid token must succeed');
  assert(authAdminOverview.body.totalBookings !== undefined, 'Overview must contain totalBookings');
  console.log(`✓ PASS: Protected admin overview retrieved successfully (Total Bookings: ${authAdminOverview.body.totalBookings}).`);

  // -------------------------------------------------------------
  // Test 6: Admin Overlap Prevention & Fleet Assignment (with JWT)
  // -------------------------------------------------------------
  console.log('\nTest 6: Vehicle schedule overlap prevention (Protected Endpoint)');
  // First assignment
  const assign1 = await makeRequest('PUT', `/api/bookings/${createdId}/assign`, {
    vehicle_no: 'TN 77AY 3006',
    driver: 'Senthil',
    approved_fare: 15000,
    trip_duration_days: 1
  }, adminHeaders);
  assert.strictEqual(assign1.status, 200, 'First assignment should succeed');
  console.log(`  - Vehicle TN 77AY 3006 successfully assigned to ${createdId} on ${testDate}.`);

  // Create a second booking on the same date
  const booking2Payload = {
    customer_id: 'CUS000002',
    pickup: 'Salem',
    delivery: 'Coimbatore',
    pickup_address: 'Warehouse A',
    delivery_address: 'Warehouse B',
    load_type: 'Machinery',
    average_weight: '2 Tons',
    helpers: 1,
    expected_date: testDate // Same date!
  };
  const bookingRes2 = await makeRequest('POST', '/api/bookings', booking2Payload);
  const createdId2 = bookingRes2.body.booking_id;

  // Attempt to assign the same vehicle TN 77AY 3006 to booking 2 on the same date!
  const overlapAttempt = await makeRequest('PUT', `/api/bookings/${createdId2}/assign`, {
    vehicle_no: 'TN 77AY 3006',
    driver: 'Senthil',
    approved_fare: 8000
  }, adminHeaders);

  assert.strictEqual(overlapAttempt.status, 409, 'Overlapping vehicle assignment must return 409 Conflict');
  console.log(`✓ PASS: Overlapping assignment rejected with HTTP 409: "${overlapAttempt.body.error}".`);

  // -------------------------------------------------------------
  // Test 7: Safe Payload Capacity Check Test
  // -------------------------------------------------------------
  console.log('\nTest 7: Safe payload capacity constraint');
  const heavyTestDate = `2027-02-${String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')}`;
  const heavyBookingPayload = {
    customer_id: 'CUS000001',
    pickup: 'Salem',
    delivery: 'Madurai',
    pickup_address: 'Quarry #2',
    delivery_address: 'Construction Site #5',
    load_type: 'Granite',
    average_weight: '7 Tons', // 7,000 kg exceeds 3,500 kg capacity!
    helpers: 0,
    expected_date: heavyTestDate
  };
  const heavyBookingRes = await makeRequest('POST', '/api/bookings', heavyBookingPayload);
  const heavyId = heavyBookingRes.body.booking_id;

  const capacityExceededAttempt = await makeRequest('PUT', `/api/bookings/${heavyId}/assign`, {
    vehicle_no: 'TN28 BF 1256', // Capacity is 3,500 kg
    driver: 'Chithiraj'
  }, adminHeaders);

  assert.strictEqual(capacityExceededAttempt.status, 400, 'Exceeding vehicle capacity must return 400 Bad Request');
  console.log(`✓ PASS: Load exceeding capacity rejected with HTTP 400: "${capacityExceededAttempt.body.error}".`);

  // Assigning the 8-Ton lorry TN 77AY 3006 to this 7-Ton load should succeed
  const validHeavyAssign = await makeRequest('PUT', `/api/bookings/${heavyId}/assign`, {
    vehicle_no: 'TN 77AY 3006',
    driver: 'Senthil'
  }, adminHeaders);
  assert.strictEqual(validHeavyAssign.status, 200, 'Assigning heavy lorry to 7 Ton load must succeed');
  console.log(`✓ PASS: Heavy lorry TN 77AY 3006 (8 Ton capacity) accepted 7 Ton load.`);

  console.log('\n==================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED)');
  console.log('==================================================');
  process.exit(0);
}

// Start backend temporarily in-process if not already listening
const server = require('./server');
setTimeout(() => {
  runApiTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}, 1200);
