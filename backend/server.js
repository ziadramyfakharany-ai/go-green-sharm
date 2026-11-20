require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EcoSpot = require('./models/EcoSpot');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const User = require('./models/User');

// Fail fast if critical secrets are missing in production
if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD) {
  console.error('❌ FATAL: Missing MONGO_URI, JWT_SECRET, or ADMIN_PASSWORD environment variables.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

// Trust Vercel reverse proxy for accurate rate-limit IPs
app.set('trust proxy', 1);

// 1. Security Headers
app.use(helmet());

// 2. Strict CORS Policy
const allowedOrigins = ['https://go-green-sharm.vercel.app'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body Parser with size limit & NoSQL Injection Sanitization
app.use(express.json({ limit: '50kb' }));
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// 4. Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests submitted. Please wait before trying again.' }
});

// ================= MONGODB SERVERLESS CONNECTION =================
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000
    }).then((m) => {
      console.log('✅ Connected to MongoDB Atlas successfully!');
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

app.use('/api', async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Helper: Timing-safe password comparison
const safeCompare = (input, secret) => {
  if (typeof input !== 'string' || typeof secret !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Middleware: Verify Admin JWT
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
};

// Middleware: Verify User JWT
const verifyUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Please login first' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded.userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional User extraction for bookings
const extractOptionalUser = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.userId) req.userId = decoded.userId;
    } catch {
      // Ignore invalid token for guest booking
    }
  }
  next();
};

// ================= AUTH ROUTES =================

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim().slice(0, 80),
      email: normalizedEmail,
      phone: phone ? String(phone).trim().slice(0, 30) : '',
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch {
    res.status(400).json({ error: 'Registration failed. Please check your details.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch {
    res.status(500).json({ error: 'Authentication service error' });
  }
});

app.post('/api/admin/login', authLimiter, (req, res) => {
  const { password } = req.body;
  if (safeCompare(password, process.env.ADMIN_PASSWORD)) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '4h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Wrong password!' });
});

// ================= SPOTS / ACTIVITIES =================

app.get('/api/spots', async (_req, res) => {
  try {
    const spots = await EcoSpot.find().sort({ createdAt: 1 });
    res.json(spots);
  } catch {
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

app.post('/api/spots', verifyAdmin, async (req, res) => {
  try {
    const { name, category, price, duration, location, description, highlights, packages, equipmentOptions, image } = req.body;
    const newSpot = await EcoSpot.create({
      name, category, price: Number(price), duration, location, description, highlights, packages, equipmentOptions, image
    });
    res.status(201).json(newSpot);
  } catch {
    res.status(400).json({ error: 'Invalid activity data' });
  }
});

app.delete('/api/spots/:id', verifyAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid activity ID' });
  }
  try {
    await EcoSpot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ================= BOOKINGS =================

app.get('/api/my-bookings', verifyUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', submissionLimiter, extractOptionalUser, async (req, res) => {
  try {
    const { activityName, customerName, contactInfo, date, guests, selectedOption, selectedEquipment, notes } = req.body;

    if (!activityName || !customerName || !contactInfo || !date) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) {
      return res.status(400).json({ error: 'Guests must be between 1 and 50.' });
    }

    const spot = await EcoSpot.findOne({ name: String(activityName).trim() });
    if (!spot) {
      return res.status(404).json({ error: 'Selected activity not found.' });
    }

    let unitPrice = spot.price;
    const matchedPkg = spot.packages.find((p) => p.label === selectedOption);
    if (matchedPkg) {
      unitPrice += matchedPkg.extraPrice || 0;
    }

    const safeEquipment = Array.isArray(selectedEquipment) ? selectedEquipment.map(String) : [];
    let equipmentTotal = 0;
    for (const eqName of safeEquipment) {
      const matchedEq = spot.equipmentOptions.find((e) => e.name === eqName);
      if (matchedEq) equipmentTotal += matchedEq.price || 0;
    }

    const calculatedTotalPrice = (unitPrice * guestCount) + equipmentTotal;

    const newBooking = await Booking.create({
      userId: req.userId || null,
      activityName: spot.name,
      customerName: String(customerName).trim().slice(0, 100),
      contactInfo: String(contactInfo).trim().slice(0, 150),
      date: String(date).trim().slice(0, 30),
      guests: guestCount,
      selectedOption: matchedPkg ? matchedPkg.label : 'Standard',
      selectedEquipment: safeEquipment,
      notes: notes ? String(notes).trim().slice(0, 500) : '',
      totalPrice: calculatedTotalPrice,
      status: 'Pending'
    });

    res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
  } catch {
    res.status(400).json({ error: 'Could not process booking.' });
  }
});

app.get('/api/bookings', verifyAdmin, async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch {
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

app.patch('/api/bookings/:id', verifyAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }
  const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled'];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch {
    res.status(400).json({ error: 'Failed to update booking' });
  }
});

// ================= SEED (PROTECTED BY ADMIN JWT) =================

app.post('/api/seed', verifyAdmin, async (_req, res) => {
  try {
    await EcoSpot.deleteMany({});
    const activities = [
      {
        name: "Electra Bicycles",
        category: "Eco Rides",
        price: 25,
        duration: "2 Hours",
        location: "Nabq & Peace Road Eco-Track",
        description: "Explore Sharm El Sheikh's scenic coastal paths and palm boulevards on comfortable, zero-emission Electra cruisers and e-bikes.",
        highlights: ["Zero-emission cruiser & e-bikes", "Coastal eco-track route", "Bottled water & route map included"],
        packages: [
          { label: "Standard Cruiser Bike (1 Person)", extraPrice: 0 },
          { label: "Electric Pedal-Assist Bike (+10$)", extraPrice: 10 },
          { label: "Tandem Bike for 2 Riders (+15$)", extraPrice: 15 }
        ],
        equipmentOptions: [
          { name: "Safety Helmet & Knee Pads (Free)", price: 0 },
          { name: "Child Seat Attachment", price: 5 },
          { name: "GoPro Handlebar Mount", price: 8 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/electra-bicycles.jpg"
      },
      {
        name: "Kite Trike",
        category: "Safari & Desert",
        price: 30,
        duration: "1.5 Hours",
        location: "Sharm Desert Wind Valley",
        description: "Experience pure wind-powered desert thrills! Glide across flat Sinai desert plains on a 3-wheel buggy pulled by a traction power kite.",
        highlights: ["100% wind-powered eco adventure", "15-min safety & kite control briefing", "Certified instructor escort"],
        packages: [
          { label: "Single Rider Trike", extraPrice: 0 },
          { label: "Extended Sunset Wind Session (+15$)", extraPrice: 15 }
        ],
        equipmentOptions: [
          { name: "Full Harness, Helmet & Goggles (Included)", price: 0 },
          { name: "Desert Scarf (Shemagh)", price: 5 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/kite-trike.jpg"      },
      {
        name: "Photo Sessions",
        category: "Eco Rides",
        price: 30,
        duration: "1.5 Hours",
        location: "Sinai Mountains & Red Sea Cliffs",
        description: "Professional golden-hour photoshoot in Sharm El Sheikh's most breathtaking desert canyons, beaches, or alongside Arabian horses.",
        highlights: ["40+ high-resolution edited photos", "2 iconic locations (Desert + Sea)", "Delivered within 24 hours"],
        packages: [
          { label: "Solo / Couple Session (40 Photos)", extraPrice: 0 },
          { label: "Family / Group Package (+20$)", extraPrice: 20 },
          { label: "Drone Aerial Video + Photos (+35$)", extraPrice: 35 }
        ],
        equipmentOptions: [
          { name: "Traditional Bedouin Outfit Prop", price: 5 },
          { name: "Horse / Camel Prop Pose", price: 15 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/photo-sessions.jpg"      },
      {
        name: "Horses and Camels",
        category: "Safari & Desert",
        price: 35,
        duration: "2 Hours",
        location: "Sinai Desert & Mangrove Coast",
        description: "Authentic Bedouin-guided Arabian horse and camel tours blending desert mountains with Red Sea shoreline views.",
        highlights: ["Well-cared-for Arabian horses & camels", "Bedouin tea break in the valley", "Suitable for beginners & experienced riders"],
        packages: [
          { label: "Camel Ride (1 Person per Camel)", extraPrice: 0 },
          { label: "Arabian Horse Ride (+5$)", extraPrice: 5 },
          { label: "Combo: 1 Hr Horse + 1 Hr Camel (+10$)", extraPrice: 10 }
        ],
        equipmentOptions: [
          { name: "Riding Helmet (Free)", price: 0 },
          { name: "Private Bedouin Guide", price: 15 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/horses-camels.jpg"      },
      {
        name: "Camping",
        category: "Safari & Desert",
        price: 50,
        duration: "Overnight (18 Hours)",
        location: "Wadi Mandar Eco-Camp - Sharm",
        description: "Spend an unforgettable night under the Milky Way in our zero-trace Sinai eco-camp with Bedouin dinner, campfire, and sunrise breakfast.",
        highlights: ["Zero light-pollution stargazing", "Authentic Bedouin BBQ dinner & breakfast", "Eco-friendly insulated tents"],
        packages: [
          { label: "1-Person Solo Dome Tent", extraPrice: 0 },
          { label: "2-Person Couple Tent (+10$)", extraPrice: 10 },
          { label: "4-Person Family Bedouin Tent (+25$)", extraPrice: 25 }
        ],
        equipmentOptions: [
          { name: "Thermal Sleeping Bag & Mattress (Included)", price: 0 },
          { name: "Stargazing Telescope Rental", price: 10 },
          { name: "Private Campfire & BBQ Kit", price: 15 },
          { name: "Portable Solar Lantern & Powerbank", price: 5 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/camping.jpg"      },
      {
        name: "Quadrocycle",
        category: "Safari & Desert",
        price: 35,
        duration: "2 Hours",
        location: "Echo Mountains & Sinai Dunes",
        description: "Guided desert quad biking adventure through dramatic canyons and golden sand plains with a stop at a traditional Bedouin tent.",
        highlights: ["Single or Double automatic quads", "Echo Valley panoramic stop", "Bedouin herbal tea included"],
        packages: [
          { label: "Single Quad Bike (1 Rider)", extraPrice: 0 },
          { label: "Double Quad Bike (2 Riders on 1 Quad +15$)", extraPrice: 15 }
        ],
        equipmentOptions: [
          { name: "Safety Helmet (Included)", price: 0 },
          { name: "Dust Goggles & Desert Scarf", price: 5 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/quadrocycle.jpg"
      },
      {
        name: "Beach BBQ's",
        category: "Water Sports",
        price: 45,
        duration: "4 Hours",
        location: "Ras Mohamed / Hidden Bay",
        description: "Relax by the Red Sea with crystal-clear reef snorkeling followed by a freshly grilled sunset beach barbecue and chill lounge.",
        highlights: ["Fresh seafood & mixed grill BBQ", "Guided coral reef snorkeling", "Sunset beach bonfire & music"],
        packages: [
          { label: "Classic Mixed Grill Beach BBQ", extraPrice: 0 },
          { label: "Seafood & Grilled Prawns Upgrade (+15$)", extraPrice: 15 },
          { label: "Vegetarian / Vegan Eco Platter", extraPrice: 0 }
        ],
        equipmentOptions: [
          { name: "Mask, Snorkel & Fins Set", price: 5 },
          { name: "Beach Lounger & Umbrella (Included)", price: 0 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/beach-bbq.jpg"
      },
      {
        name: "Sandboarding",
        category: "Safari & Desert",
        price: 25,
        duration: "2 Hours",
        location: "Great Sand Dunes - Sharm",
        description: "Carve and slide down silky golden dunes in Sinai on waxed pro sandboards—high-speed desert fun with zero carbon footprint.",
        highlights: ["Pro waxed wooden & composite boards", "4x4 transfer to high dunes", "Beginner coaching included"],
        packages: [
          { label: "Standard Sandboard Session", extraPrice: 0 },
          { label: "Sandboarding + Sunset Tea (+8$)", extraPrice: 8 }
        ],
        equipmentOptions: [
          { name: "Pro Sandboard & Boots (Included)", price: 0 },
          { name: "Action Camera Chest Mount", price: 7 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/sandboarding.jpg"
      },
      {
        name: "Kayaking",
        category: "Water Sports",
        price: 25,
        duration: "1.5 Hours",
        location: "Nabq Mangrove Lagoon",
        description: "Paddle silently over turquoise waters and explore Sharm's protected coastal mangrove forest and vibrant shallow reefs.",
        highlights: ["Stable sit-on-top & transparent kayaks", "Protected mangrove wildlife route", "Life jackets & dry bags provided"],
        packages: [
          { label: "Single Kayak (1 Paddler)", extraPrice: 0 },
          { label: "Double Tandem Kayak (2 Paddlers +15$)", extraPrice: 15 },
          { label: "Crystal Glass-Bottom Kayak (+12$)", extraPrice: 12 }
        ],
        equipmentOptions: [
          { name: "Life Vest & Paddle (Included)", price: 0 },
          { name: "Waterproof Phone Pouch & Dry Bag", price: 4 },
          { name: "Snorkeling Mask Add-on", price: 5 }
        ],
        image: "https://go-green-sharm.vercel.app/activities/kayaking.jpg"
      }
    ];
    const created = await EcoSpot.insertMany(activities);
    res.json({ message: 'Activities seeded successfully!', count: created.length });
  } catch {
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// ================= REVIEWS =================

app.get('/api/reviews', async (req, res) => {
  try {
    const filter = {};
    if (req.query.activityId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.activityId)) {
        return res.status(400).json({ error: 'Invalid activityId' });
      }
      filter.activityId = req.query.activityId;
    }
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', submissionLimiter, async (req, res) => {
  try {
    const { activityId, reviewerName, country, rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }
    const spot = await EcoSpot.findById(activityId);
    if (!spot) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const newReview = await Review.create({
      activityId: spot._id,
      activityName: spot.name,
      reviewerName: String(reviewerName || '').trim().slice(0, 80),
      country: country ? String(country).trim().slice(0, 60) : 'Guest',
      rating: Math.round(numericRating),
      comment: String(comment || '').trim().slice(0, 1000)
    });
    res.status(201).json(newReview);
  } catch {
    res.status(400).json({ error: 'Failed to submit review' });
  }
});

app.delete('/api/reviews/:id', verifyAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Error deleting review' });
  }
});

// Health Check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Sharm Go Green API is live!' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy: Origin not allowed' });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;