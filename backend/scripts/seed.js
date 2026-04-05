/**
 * Seeds sample problems and an admin user.
 * Run: npm run seed (from backend folder)
 * Requires .env with MONGODB_URI and JWT_SECRET (JWT not used here but good practice)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Problem = require('../models/Problem');

const SAMPLE_PROBLEMS = [
  {
    title: 'Hello World',
    description:
      'Write a program that reads a name from input and prints `Hello, <name>!` on a single line.',
    input: 'Evalbyte',
    expectedOutput: 'Hello, Evalbyte!',
    difficulty: 'Easy',
    testCases: [],
  },
  {
    title: 'Sum of Two Numbers',
    description:
      'Read two integers from stdin (space-separated on one line) and print their sum.',
    input: '3 5',
    expectedOutput: '8',
    difficulty: 'Easy',
    testCases: [
      { input: '10 20', expectedOutput: '30' },
      { input: '-2 7', expectedOutput: '5' },
    ],
  },
  {
    title: 'Factorial',
    description:
      'Read a single integer n (0 ≤ n ≤ 12) and print n! (factorial) as an integer.',
    input: '5',
    expectedOutput: '120',
    difficulty: 'Medium',
    testCases: [{ input: '0', expectedOutput: '1' }],
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@evalbyte.local';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPass, 10);
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashed,
      role: 'admin',
    });
    console.log('Created admin:', adminEmail, '/ password:', adminPass);
  } else {
    console.log('Admin already exists:', adminEmail);
  }

  const count = await Problem.countDocuments();
  if (count === 0) {
    await Problem.insertMany(SAMPLE_PROBLEMS);
    console.log('Inserted', SAMPLE_PROBLEMS.length, 'sample problems');
  } else {
    console.log('Problems already present, skipping problem seed');
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
