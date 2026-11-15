require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EcoSpot = require('./models/EcoSpot');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Middleware للتحقق من كلمة سر الأدمن
const verifyAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
  }
  next();
};

// Middleware للتحقق من تسجيل دخول اليوزر
const verifyUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Please login first' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sharm_go_green_super_secret_2026');
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// إنشاء حساب مستخدم جديد (Register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashedPassword });
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'sharm_go_green_super_secret_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// تسجيل دخول المستخدم (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'sharm_go_green_super_secret_2026',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب حجوزات المستخدم المسجل حالياً
app.get('/api/my-bookings', verifyUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// التحقق من كلمة السر عند تسجيل دخول الأدمن
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Wrong password!' });
});

// جلب كل الأنشطة (متاح للزوار)
app.get('/api/spots', async (req, res) => {
  try {
    const spots = await EcoSpot.find().sort({ createdAt: 1 });
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// استقبال حجز جديد من العميل (متاح للزوار والمستخدمين)
app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// عرض كل الحجوزات (محمي للأدمن فقط)
app.get('/api/bookings', verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث حالة الحجز (محمي للأدمن فقط)
app.patch('/api/bookings/:id', verifyAdmin, async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// إضافة نشاط جديد (محمي للأدمن فقط)
app.post('/api/spots', verifyAdmin, async (req, res) => {
  try {
    const newSpot = new EcoSpot(req.body);
    await newSpot.save();
    res.status(201).json(newSpot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// حذف نشاط (محمي للأدمن فقط)
app.delete('/api/spots/:id', verifyAdmin, async (req, res) => {
  try {
    await EcoSpot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ملء الداتابيز بأنشطة Sharm Go Green الـ 9 ومعداتها
app.post('/api/seed', async (req, res) => {
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
        image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80"
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
        image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=800&q=80"
      },
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
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
      },
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
        image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80"
      },
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
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"
      },
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
        image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80"
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
        image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=800&q=80"
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
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
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
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
      }
    ];
    const created = await EcoSpot.insertMany(activities);
    res.json({ message: 'Activities seeded successfully!', count: created.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل التقييمات أو تقييمات نشاط معين
app.get('/api/reviews', async (req, res) => {
  try {
    const filter = req.query.activityId ? { activityId: req.query.activityId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة تقييم جديد من العميل
app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// حذف تقييم معين (محمي للأدمن فقط)
app.delete('/api/reviews/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

// إضافة مسار ترحيبي للتأكد إن الـ API شغال أونلاين
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Sharm Go Green API is live!' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;