/**
 * CivicSeva Demo Data Seeder
 * 
 * Populates the database with realistic, presentation-ready demo data
 * aligned to the actual Mongoose schemas (User + Complaint).
 * 
 * Usage: node src/seeders/demoSeeder.js
 *        node src/seeders/demoSeeder.js --force  (re-seed)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Kolkata Locations ──────────────────────────────
const KOLKATA_LOCATIONS = [
  { area: 'Salt Lake, Kolkata - 700091', pincode: '700091', lat: 22.5726, lng: 88.4312 },
  { area: 'Park Street, Kolkata - 700016', pincode: '700016', lat: 22.5521, lng: 88.3536 },
  { area: 'New Town, Kolkata - 700156', pincode: '700156', lat: 22.5958, lng: 88.4795 },
  { area: 'Jadavpur, Kolkata - 700032', pincode: '700032', lat: 22.4987, lng: 88.3702 },
  { area: 'Behala, Kolkata - 700034', pincode: '700034', lat: 22.4930, lng: 88.3230 },
  { area: 'Howrah Bridge, Kolkata - 700001', pincode: '700001', lat: 22.5851, lng: 88.3468 },
  { area: 'Gariahat, Kolkata - 700019', pincode: '700019', lat: 22.5186, lng: 88.3688 },
  { area: 'Dumdum, Kolkata - 700028', pincode: '700028', lat: 22.6221, lng: 88.4120 },
  { area: 'Ballygunge, Kolkata - 700019', pincode: '700019', lat: 22.5296, lng: 88.3689 },
  { area: 'Alipore, Kolkata - 700027', pincode: '700027', lat: 22.5329, lng: 88.3378 },
  { area: 'Esplanade, Kolkata - 700069', pincode: '700069', lat: 22.5646, lng: 88.3525 },
  { area: 'Tollygunge, Kolkata - 700033', pincode: '700033', lat: 22.4988, lng: 88.3479 },
];

// ─── Complaint Templates ────────────────────────────
const COMPLAINT_TEMPLATES = [
  {
    category: 'Roads',
    titles: [
      'Deep pothole causing accidents near bus stand',
      'Road surface completely damaged after monsoon',
      'Broken speed breaker hazard near school zone',
      'Waterlogging on main arterial road',
      'Missing lane markings on busy intersection',
    ],
    descriptions: [
      'A large pothole approximately 2 feet deep has formed near the bus stop. Multiple two-wheelers have fallen and one person was injured last week. Urgent repair needed before more accidents occur.',
      'The road surface has deteriorated severely after recent heavy rains. The entire stretch is now unpassable for smaller vehicles and pedestrians are forced to walk on mud.',
      'The speed breaker near the school entrance is broken and has sharp edges exposed. Children crossing the road are at serious risk during school hours.',
      'Persistent waterlogging for the past 3 days making the road inaccessible. Storm drains appear to be blocked. Residents are having difficulty commuting.',
      'Lane markings have faded completely at the four-way intersection. This is causing frequent near-miss accidents especially during peak hours.',
    ],
  },
  {
    category: 'Water',
    titles: [
      'No water supply for 48 hours in residential area',
      'Contaminated water from municipality supply',
      'Major pipeline leak flooding the neighborhood',
      'Low water pressure affecting multi-story buildings',
      'Sewage mixing with drinking water lines',
    ],
    descriptions: [
      'Our entire block has not received municipal water supply for 48 hours. Families with elderly members and small children are severely affected. Private tanker costs are unsustainable.',
      'The tap water has been yellowish-brown for the past week. Several residents have reported stomach infections. Lab testing needed urgently.',
      'A major water main has burst near the crossing, causing flooding. The water has been flowing for 2 days with no repair team arriving. Massive water waste.',
      'Water pressure has been extremely low for the past 2 weeks. Upper floors of buildings are getting no water at all during peak hours.',
      'Sewage water is mixing with the drinking water supply line. Multiple families have fallen sick. This is a public health emergency.',
    ],
  },
  {
    category: 'Garbage',
    titles: [
      'Overflowing garbage dump attracting rats and stray dogs',
      'No waste collection for over a week in our ward',
      'Illegal dumping ground near residential area',
      'Broken dustbins not replaced for months',
      'Medical waste found in regular garbage bins',
    ],
    descriptions: [
      'The community garbage dump has been overflowing for days. Rats and stray dogs are spreading waste across the road. The stench is unbearable for nearby residents.',
      'KMC waste collection trucks have not visited our ward for 8 days now. Garbage is piling up on streets and open spaces, creating hygiene hazards.',
      'Unauthorized garbage dumping is happening regularly near our colony boundary wall. The dump is growing daily and may cause drainage blockage.',
      'Three community dustbins were damaged during a storm 4 months ago and have not been replaced. Residents have no option but to dump on the road.',
      'Used syringes and medical waste were found in the regular community dustbin near a park. Children play in the area and this poses serious health risks.',
    ],
  },
  {
    category: 'Electricity',
    titles: [
      'Frequent power cuts during evening hours',
      'Street lights not working in dark alley',
      'Exposed electrical wires near playground',
      'Transformer overheating and sparking',
      'No electricity restoration after storm damage',
    ],
    descriptions: [
      'We are experiencing 2-3 hour power cuts every evening between 6 PM and 10 PM. This has been going on for 2 weeks. Students cannot study and businesses are losing revenue.',
      'All 8 street lights on the lane leading to the park have been non-functional for over a month. Women and elderly feel unsafe walking after dark.',
      'High voltage electrical wires have fallen low near the children\'s playground. This is extremely dangerous especially during rainy season. Immediate action required.',
      'The neighborhood transformer has been sparking and overheating. We can hear crackling sounds at night. This is a fire hazard for surrounding buildings.',
      'A fallen tree damaged power lines during last week\'s storm. It has been 5 days but electricity has not been restored to 15 households.',
    ],
  },
  {
    category: 'Others',
    titles: [
      'Stray dog menace near children\'s school',
      'Public toilet in unusable condition',
      'Illegal encroachment blocking pedestrian path',
      'Noise pollution from illegal construction at night',
      'Missing manhole cover on busy footpath',
    ],
    descriptions: [
      'A pack of aggressive stray dogs has been gathering near the school entrance. Three children have been chased in the last week. Animal control needs to intervene.',
      'The public toilet near the bus stop is in a deplorable state — no water, broken doors, and extremely unhygienic. It needs complete renovation.',
      'Vendors have illegally set up permanent shops on the footpath, forcing pedestrians to walk on the road. This is dangerous especially during rush hour.',
      'A construction site is operating heavy machinery well past midnight. The noise is disturbing the sleep of hundreds of residents and violates noise regulations.',
      'A manhole cover is missing on the main footpath. It\'s especially dangerous at night. A temporary barricade was placed but has been removed.',
    ],
  },
];

// ─── User Profiles (matched to actual User schema) ─
const DEMO_USERS = [
  { name: 'Anshuman Jha', email: 'anshuman@civicseva.in', points: 2450, level: 'Civic Champion', streak: 12, badgeName: 'Civic Champion', badgeDesc: 'Top contributor to the platform', badgeIcon: '🏆' },
  { name: 'Priya Sharma', email: 'priya@civicseva.in', points: 1820, level: 'Civic Guardian', streak: 8, badgeName: 'Guardian', badgeDesc: 'Protected the community', badgeIcon: '🛡️' },
  { name: 'Rahul Gupta', email: 'rahul@civicseva.in', points: 1650, level: 'Civic Guardian', streak: 15, badgeName: 'Streak Master', badgeDesc: '15 day activity streak', badgeIcon: '🔥' },
  { name: 'Sneha Das', email: 'sneha@civicseva.in', points: 1200, level: 'Urban Visionary', streak: 5, badgeName: 'Rising Star', badgeDesc: 'Rapidly rising contributor', badgeIcon: '⭐' },
  { name: 'Arjun Patel', email: 'arjun@civicseva.in', points: 980, level: 'City Advocate', streak: 7, badgeName: 'Watchdog', badgeDesc: 'Always vigilant', badgeIcon: '👁️' },
  { name: 'Kavita Roy', email: 'kavita@civicseva.in', points: 750, level: 'Civic Leader', streak: 3, badgeName: 'Contributor', badgeDesc: 'Active community member', badgeIcon: '🤝' },
  { name: 'Amit Singh', email: 'amit@civicseva.in', points: 620, level: 'Civic Leader', streak: 4, badgeName: 'Reporter', badgeDesc: 'Consistent issue reporter', badgeIcon: '📋' },
  { name: 'Ritu Devi', email: 'ritu@civicseva.in', points: 350, level: 'Neighborhood Guard', streak: 2, badgeName: 'Newcomer', badgeDesc: 'Welcome to CivicSeva!', badgeIcon: '🌱' },
];

// ─── Status Distribution (matching schema enum) ─────
// Schema only allows: 'Pending', 'In Progress', 'Resolved'
const STATUS_DISTRIBUTION = [
  { status: 'Pending', weight: 35 },
  { status: 'In Progress', weight: 30 },
  { status: 'Resolved', weight: 35 },
];

function weightedRandomStatus() {
  const total = STATUS_DISTRIBUTION.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of STATUS_DISTRIBUTION) {
    r -= d.weight;
    if (r <= 0) return d.status;
  }
  return 'Pending';
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// ─── Main Seeder ────────────────────────────────────
async function seedDemoData() {
  try {
    console.log('🌱 CivicSeva Demo Data Seeder');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    const User = require('../models/User');
    const Complaint = require('../models/Complaint');

    // Check flag to avoid duplicate seeding
    const existingDemoUser = await User.findOne({ email: 'anshuman@civicseva.in' });
    if (existingDemoUser) {
      console.log('⚠️  Demo data already exists. Run with --force to reseed.');
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
      console.log('🔄 Force mode: Cleaning existing demo data...');
      // Delete demo users
      const demoUserIds = (await User.find({ email: { $regex: /@civicseva\.in$/ } }).select('_id')).map(u => u._id);
      await Complaint.deleteMany({ user: { $in: demoUserIds } });
      await User.deleteMany({ email: { $regex: /@civicseva\.in$/ } });
      console.log('   ✓ Cleaned previous demo data\n');
    }

    // 1. Create demo users (matching actual User schema)
    console.log('👤 Creating demo users...');
    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: 'CivicSeva@Demo2026',
        level: userData.level,
        points: userData.points,
        currentStreak: userData.streak,
        lastActiveDate: new Date(),
        badges: [{
          name: userData.badgeName,
          description: userData.badgeDesc,
          icon: userData.badgeIcon,
          awardedAt: randomDate(30),
        }],
        challenges: [
          {
            title: 'Report 5 Issues',
            description: 'Help your community by reporting 5 civic issues',
            target: 5,
            progress: randomBetween(2, 5),
            isCompleted: Math.random() > 0.5,
            xpReward: 50,
          },
          {
            title: 'Get 10 Upvotes',
            description: 'Get your reports noticed by the community',
            target: 10,
            progress: randomBetween(3, 10),
            isCompleted: Math.random() > 0.6,
            xpReward: 30,
          },
        ],
      });
      createdUsers.push(user);
      console.log(`   ✓ ${userData.name} (${userData.level}, ${userData.points} pts)`);
    }

    // 2. Create realistic complaints (matching actual Complaint schema)
    console.log('\n📋 Creating realistic complaints...');
    let totalCreated = 0;

    for (const template of COMPLAINT_TEMPLATES) {
      for (let i = 0; i < template.titles.length; i++) {
        const location = randomFrom(KOLKATA_LOCATIONS);
        const user = randomFrom(createdUsers);
        const status = weightedRandomStatus();
        const createdAt = randomDate(60);
        const upvoteCount = randomBetween(3, 85);
        
        // Generate follower list (unique user IDs, excluding the creator)
        const followerCount = randomBetween(1, Math.min(4, createdUsers.length - 1));
        const followers = [];
        const shuffled = [...createdUsers].sort(() => 0.5 - Math.random());
        for (const candidate of shuffled) {
          if (followers.length >= followerCount) break;
          if (candidate._id.toString() !== user._id.toString()) {
            followers.push(candidate._id);
          }
        }

        // Generate verification array
        const verifyCount = randomBetween(0, 3);
        const verifications = [];
        const verifyPool = [...createdUsers].sort(() => 0.5 - Math.random());
        for (let v = 0; v < verifyCount && v < verifyPool.length; v++) {
          verifications.push(verifyPool[v]._id);
        }

        // Slight coordinate jitter for realistic marker spread
        const jitterLat = (Math.random() - 0.5) * 0.01;
        const jitterLng = (Math.random() - 0.5) * 0.01;

        // Build timeline entries based on status
        const timeline = [
          {
            status: 'Pending',
            message: 'Complaint registered successfully',
            timestamp: createdAt,
            actor: 'System',
            isMilestone: true,
          },
        ];
        if (status === 'In Progress' || status === 'Resolved') {
          timeline.push({
            status: 'In Progress',
            message: 'Assigned to maintenance team',
            timestamp: new Date(createdAt.getTime() + randomBetween(1, 5) * 24 * 60 * 60 * 1000),
            actor: 'Authority',
            isMilestone: false,
          });
        }
        if (status === 'Resolved') {
          timeline.push({
            status: 'Resolved',
            message: 'Issue has been resolved. Thank you for reporting!',
            timestamp: new Date(createdAt.getTime() + randomBetween(5, 14) * 24 * 60 * 60 * 1000),
            actor: 'Authority',
            isMilestone: true,
          });
        }

        await Complaint.create({
          title: template.titles[i],
          description: template.descriptions[i],
          category: template.category,
          status,
          location: {
            type: 'Point',
            coordinates: [location.lng + jitterLng, location.lat + jitterLat],
          },
          city: 'Kolkata',
          pincode: location.pincode,
          user: user._id,
          upvotes: upvoteCount,
          followers,
          verifications,
          priorityScore: upvoteCount * 2 + followers.length * 5 + verifications.length * 10,
          timeline,
          createdAt,
          updatedAt: status === 'Resolved'
            ? new Date(createdAt.getTime() + randomBetween(5, 14) * 24 * 60 * 60 * 1000)
            : createdAt,
        });

        totalCreated++;
      }
    }

    console.log(`   ✓ Created ${totalCreated} realistic complaints\n`);

    // 3. Summary
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const complaintsByStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('📊 Demo Data Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Users:      ${createdUsers.length}`);
    console.log(`   Complaints: ${totalCreated}`);
    console.log('\n   By Category:');
    complaintsByCategory.forEach(c => console.log(`     ${c._id}: ${c.count}`));
    console.log('\n   By Status:');
    complaintsByStatus.forEach(s => console.log(`     ${s._id}: ${s.count}`));
    console.log('\n✅ Demo data seeded successfully!');
    console.log('   Login with any demo user: password = CivicSeva@Demo2026');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error.message);
    if (error.errors) {
      Object.entries(error.errors).forEach(([field, err]) => {
        console.error(`   → ${field}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

seedDemoData();
