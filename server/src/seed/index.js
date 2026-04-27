require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const College = require('../models/College');
const User = require('../models/User');
const Place = require('../models/Place');
const Review = require('../models/Review');
const Post = require('../models/Post');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-compass';

const colleges = [
  {
    name: 'Indian Institute of Technology Delhi',
    shortName: 'IIT-D',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.1935, 28.5450] },
    description: 'Premier engineering institution of India',
    establishedYear: 1961,
    website: 'https://home.iitd.ac.in'
  },
  {
    name: 'Delhi University - North Campus',
    shortName: 'DU-NC',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.2090, 28.6872] },
    description: 'One of India\'s largest universities',
    establishedYear: 1922,
    website: 'https://www.du.ac.in'
  },
  {
    name: 'Jawaharlal Nehru University',
    shortName: 'JNU',
    city: 'New Delhi',
    state: 'Delhi',
    location: { type: 'Point', coordinates: [77.1676, 28.5411] },
    description: 'Central university known for social sciences',
    establishedYear: 1969,
    website: 'https://www.jnu.ac.in'
  },
  {
    name: 'University of Mumbai',
    shortName: 'MU',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: { type: 'Point', coordinates: [72.8553, 18.9389] },
    description: 'Largest university in Mumbai',
    establishedYear: 1857,
    website: 'https://mu.ac.in'
  },
  {
    name: 'Anna University',
    shortName: 'AU',
    city: 'Chennai',
    state: 'Tamil Nadu',
    location: { type: 'Point', coordinates: [80.2357, 13.0101] },
    description: 'Technical university in Chennai',
    establishedYear: 1978,
    website: 'https://www.annauniv.edu'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      College.deleteMany({}),
      User.deleteMany({}),
      Place.deleteMany({}),
      Review.deleteMany({}),
      Post.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');

    // Create colleges
    const createdColleges = await College.insertMany(colleges);
    console.log(`✅ Created ${createdColleges.length} colleges`);

    const iitd = createdColleges[0];

    // Create admin user
    const admin = await User.create({
      name: 'Campus Admin',
      email: 'admin@campuscompass.in',
      password: 'Admin@123',
      college: iitd._id,
      role: 'admin',
      year: '4th Year',
      isStudentVerified: true
    });

    // Create sample student users
    const users = await Promise.all([
      User.create({
        name: 'Arjun Sharma',
        email: 'arjun@iitd.ac.in',
        password: 'Student@123',
        college: iitd._id,
        year: '3rd Year',
        department: 'Computer Science',
        isStudentVerified: true,
        bio: 'CS undergrad | Food explorer | Chai addict ☕'
      }),
      User.create({
        name: 'Priya Mehta',
        email: 'priya@iitd.ac.in',
        password: 'Student@123',
        college: iitd._id,
        year: '2nd Year',
        department: 'Electrical Engineering',
        isStudentVerified: true,
        bio: 'EE sophomore | Weekend chef | Photography enthusiast'
      }),
      User.create({
        name: 'Rahul Kumar',
        email: 'rahul@iitd.ac.in',
        password: 'Student@123',
        college: iitd._id,
        year: '1st Year',
        department: 'Mechanical Engineering',
        isStudentVerified: false
      })
    ]);

    console.log(`✅ Created ${users.length + 1} users`);

    // Create sample places
    const places = await Place.insertMany([
      {
        name: 'Nescafé Stall - Main Building',
        description: 'The legendary Nescafé stall that has fueled generations of IIT Delhi students through exams, late night coding sessions, and heartbreaks. Best chai in campus hands down.',
        category: 'cafe',
        tags: ['chai-coffee', 'cheap-eats-50-100', 'late-night-open', 'exam-fuel', 'quick-bites'],
        college: iitd._id,
        addedBy: users[0]._id,
        location: { type: 'Point', coordinates: [77.1940, 28.5455] },
        address: 'Near Main Building, IIT Delhi',
        landmark: 'Opposite LHC',
        distanceFromGate: '200m from Main Gate',
        timings: { openTime: '07:00', closeTime: '23:00', isOpen24Hours: false },
        priceRange: { min: 10, max: 50 },
        isVerified: true,
        averageRating: 4.5,
        reviewCount: 0,
        trendingScore: 85
      },
      {
        name: 'Amul Outlet - Hostel Area',
        description: 'Quick bites, ice cream, milk, bread, butter. Everything a student needs at 2 AM. Surprisingly affordable for hostel life.',
        category: 'grocery',
        tags: ['cheap-eats-50-100', 'quick-bites', 'late-night-open'],
        college: iitd._id,
        addedBy: users[0]._id,
        location: { type: 'Point', coordinates: [77.1945, 28.5465] },
        address: 'Hostel Area, IIT Delhi',
        landmark: 'Near Zanskar Hostel',
        priceRange: { min: 20, max: 150 },
        isVerified: true,
        averageRating: 4.2,
        reviewCount: 0,
        trendingScore: 72
      },
      {
        name: 'Student Activity Centre Canteen',
        description: 'The go-to lunch spot for everyone. Massive portions, multiple cuisines, AC seating, fast WiFi. Great for group hangouts and study sessions.',
        category: 'restaurant',
        tags: ['wifi-available', 'good-for-study', 'group-hangout', 'cheap-eats-100-200', 'ac-available', 'vegetarian-friendly'],
        college: iitd._id,
        addedBy: users[1]._id,
        location: { type: 'Point', coordinates: [77.1930, 28.5448] },
        address: 'SAC Building, IIT Delhi',
        landmark: 'Inside Student Activity Centre',
        timings: { openTime: '08:00', closeTime: '22:00', closedOn: ['Sun'] },
        priceRange: { min: 60, max: 200 },
        isVerified: true,
        averageRating: 3.8,
        reviewCount: 0,
        trendingScore: 68
      },
      {
        name: 'Cheap Pete\'s Street Food Corner',
        description: 'Outside the back gate. The best maggi, momos, and chaat you\'ll find near campus. Legendary among hostelers. Cash only.',
        category: 'street-food',
        tags: ['street-food', 'cheap-eats-50-100', 'late-night-open', 'outdoor-seating', 'quick-bites'],
        college: iitd._id,
        addedBy: users[0]._id,
        location: { type: 'Point', coordinates: [77.1925, 28.5440] },
        address: 'Back Gate Road, Near IIT Delhi',
        distanceFromGate: '50m from Back Gate',
        timings: { openTime: '16:00', closeTime: '01:00' },
        priceRange: { min: 20, max: 80 },
        averageRating: 4.7,
        reviewCount: 0,
        trendingScore: 95
      },
      {
        name: 'Library Reading Café',
        description: 'Quiet café inside the central library complex. Perfect for long study sessions - good coffee, power outlets at every seat, dead silent.',
        category: 'cafe',
        tags: ['good-for-study', 'wifi-available', 'power-outlets', 'chai-coffee', 'cheap-eats-100-200'],
        college: iitd._id,
        addedBy: users[1]._id,
        location: { type: 'Point', coordinates: [77.1935, 28.5460] },
        address: 'Central Library Building, IIT Delhi',
        timings: { openTime: '09:00', closeTime: '21:00', closedOn: ['Sun'] },
        priceRange: { min: 40, max: 180 },
        isVerified: true,
        averageRating: 4.3,
        reviewCount: 0,
        trendingScore: 78
      }
    ]);

    console.log(`✅ Created ${places.length} places`);

    // Create reviews
    const reviews = await Promise.all([
      Review.create({
        user: users[0]._id,
        place: places[0]._id,
        college: iitd._id,
        rating: 5,
        title: 'Best chai in all of Delhi probably',
        body: 'I have been coming here for 3 years and this chai wala has seen me through 12 exams. The chai is perfectly sweet, the cutting size is generous, and the bhaiya knows my order without asking. Sacred place.',
        isStudentVerified: true
      }),
      Review.create({
        user: users[1]._id,
        place: places[0]._id,
        college: iitd._id,
        rating: 4,
        title: 'Great but gets crowded after 6pm',
        body: 'Chai is amazing, coffee is decent. The only downside is it becomes insanely crowded between 6-8pm when everyone is done with labs. Go at off-peak times for the best experience.',
        isStudentVerified: true
      }),
      Review.create({
        user: users[0]._id,
        place: places[3]._id,
        college: iitd._id,
        rating: 5,
        title: 'The momos here are criminally underrated',
        body: 'Steamed momos at ₹50 for 8 pieces, perfectly spiced. The maggi is also fantastic - they add extra veggies. Late night this is the only saving grace. The uncle is also super friendly.',
        isStudentVerified: true
      }),
      Review.create({
        user: users[2]._id,
        place: places[2]._id,
        college: iitd._id,
        rating: 3,
        title: 'Decent but inconsistent quality',
        body: 'Sometimes the food is great, sometimes it\'s not. The thali is good value at ₹80 but the dal quality varies a lot. WiFi works well though and seating is comfortable for studying.',
        isStudentVerified: false
      }),
      Review.create({
        user: users[1]._id,
        place: places[4]._id,
        college: iitd._id,
        rating: 4,
        title: 'Hidden gem for serious study sessions',
        body: 'Not many people know about this place. Super quiet, good AC, power outlets at every seat. Coffee is decent but not amazing. Perfect if you need to grind for 4-5 hours without disturbance.',
        isStudentVerified: true
      })
    ]);

    console.log(`✅ Created ${reviews.length} reviews`);

    // Create feed posts
    const posts = await Post.insertMany([
      {
        author: users[0]._id,
        college: iitd._id,
        content: 'Best place for late night chai near hostel zone? I\'ve been surviving on Maggi but need something warm after 11pm 😭',
        type: 'question',
        tags: ['chai', 'late-night', 'hostel'],
        upvotes: [users[1]._id, users[2]._id]
      },
      {
        author: users[1]._id,
        college: iitd._id,
        content: 'PSA: The SAC canteen has started a new breakfast menu from 7-9am. Poha, upma, and idli-sambhar at ₹30-50. Great for early lab days! 🍽️',
        type: 'tip',
        linkedPlaces: [places[2]._id],
        upvotes: [users[0]._id]
      },
      {
        author: users[2]._id,
        college: iitd._id,
        content: 'Any good printing shops near campus? Need color printing for my design project presentation tomorrow morning 🖨️',
        type: 'question',
        tags: ['printing', 'urgent'],
        isAnonymous: false,
        upvotes: []
      },
      {
        author: users[0]._id,
        college: iitd._id,
        content: 'Controversial opinion: The back gate street food uncle makes better momos than any restaurant in Hauz Khas. Fight me 🥟',
        type: 'recommendation',
        linkedPlaces: [places[3]._id],
        upvotes: [users[1]._id, users[2]._id],
        isAnonymous: false
      },
      {
        author: users[1]._id,
        college: iitd._id,
        content: 'Anyone else notice the library café finally got fast WiFi? Finally can work from there without using mobile data! The cold coffee is also much better now 📶',
        type: 'tip',
        linkedPlaces: [places[4]._id],
        upvotes: [users[0]._id, users[2]._id]
      }
    ]);

    console.log(`✅ Created ${posts.length} posts`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📧 Test credentials:');
    console.log('   Admin:   admin@campuscompass.in / Admin@123');
    console.log('   Student: arjun@iitd.ac.in / Student@123');
    console.log('   Student: priya@iitd.ac.in / Student@123\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
