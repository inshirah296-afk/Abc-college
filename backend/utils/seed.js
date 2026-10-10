// Populates the database with sample data so the site looks alive on first run.
// Run with: npm run seed   (make sure MONGODB_URI is set in .env first)
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Event = require("../models/Event");
const EventCategory = require("../models/EventCategory");
const Registration = require("../models/Registration");
const Announcement = require("../models/Announcement");
const Feedback = require("../models/Feedback");

const categories = [
  "Technical", "Cultural", "Sports", "Workshop", "Seminar", "Symposium",
  "Hackathon", "Quiz", "Debate", "Arts", "Music", "Dance",
  "Photography", "Entrepreneurship", "Department Events",
];

const departments = ["Computer Science", "Electronics", "Mechanical", "Civil", "Business Administration"];

function daysFromNow(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const run = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    EventCategory.deleteMany({}),
    Registration.deleteMany({}),
    Announcement.deleteMany({}),
    Feedback.deleteMany({}),
  ]);

  console.log("Creating categories...");
  await EventCategory.insertMany(
    categories.map((name) => ({ name, icon: "bi-calendar-event" }))
  );

  console.log("Creating admin account...");
  const admin = await User.create({
    name: process.env.ADMIN_NAME || "Admin User",
    email: process.env.ADMIN_EMAIL || "admin@abccollege.edu",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    role: "admin",
  });

  console.log("Creating sample students...");
  const students = await User.insertMany(
    [
      { name: "Aarav Sharma", email: "aarav@student.abccollege.edu", studentId: "ABC2023001", department: "Computer Science", year: "2", phone: "9000000001" },
      { name: "Diya Patel", email: "diya@student.abccollege.edu", studentId: "ABC2023002", department: "Electronics", year: "3", phone: "9000000002" },
      { name: "Rohan Verma", email: "rohan@student.abccollege.edu", studentId: "ABC2023003", department: "Mechanical", year: "1", phone: "9000000003" },
      { name: "Sneha Iyer", email: "sneha@student.abccollege.edu", studentId: "ABC2023004", department: "Business Administration", year: "4", phone: "9000000004" },
      { name: "Karthik Raj", email: "karthik@student.abccollege.edu", studentId: "ABC2023005", department: "Civil", year: "2", phone: "9000000005" },
    ].map((s) => ({ ...s, password: "Student@123", role: "student" }))
  );

  console.log("Creating events...");
  const eventDefs = [
    { title: "CodeStorm Hackathon", category: "Hackathon", description: "A 24-hour coding marathon where teams build solutions to real-world problems.", days: 10, venue: "Innovation Lab, Block C", organizer: "Computer Science Association", max: 60, rules: "Teams of 2-4. Bring your own laptop.", contact: "hackathon@abccollege.edu" },
    { title: "Rhythms - Annual Cultural Fest", category: "Cultural", description: "A vibrant evening of music, dance and drama performances by students across departments.", days: 20, venue: "Main Auditorium", organizer: "Cultural Committee", max: 300, rules: "Open to all students. Register per event.", contact: "cultural@abccollege.edu" },
    { title: "Inter-Department Cricket Tournament", category: "Sports", description: "Annual cricket tournament between departments, knockout format.", days: 15, venue: "College Sports Ground", organizer: "Sports Committee", max: 120, rules: "11 players + 4 substitutes per team.", contact: "sports@abccollege.edu" },
    { title: "AI & Machine Learning Workshop", category: "Workshop", description: "Hands-on workshop covering the fundamentals of machine learning with Python.", days: 7, venue: "Seminar Hall 2", organizer: "Dept. of Computer Science", max: 80, rules: "Bring a laptop with Python installed.", contact: "cs.dept@abccollege.edu" },
    { title: "National Symposium on Renewable Energy", category: "Symposium", description: "Paper presentations and expert talks on sustainable energy solutions.", days: 25, venue: "Conference Hall", organizer: "Dept. of Electronics", max: 150, rules: "Abstract submission required before the event.", contact: "electronics@abccollege.edu" },
    { title: "General Quiz Championship", category: "Quiz", description: "A fun and competitive general knowledge quiz open to all years.", days: 5, venue: "Room 204", organizer: "Quiz Club", max: 100, rules: "Teams of 2.", contact: "quizclub@abccollege.edu" },
    { title: "Parliamentary Debate Championship", category: "Debate", description: "Inter-college debate competition on contemporary issues.", days: 18, venue: "Seminar Hall 1", organizer: "Debate Society", max: 64, rules: "Teams of 2, British Parliamentary format.", contact: "debate@abccollege.edu" },
    { title: "Canvas & Colors - Art Exhibition", category: "Arts", description: "Showcase of student paintings, sketches and digital art.", days: 12, venue: "Art Gallery, Block A", organizer: "Fine Arts Club", max: 50, rules: "Submit artwork one week prior.", contact: "arts@abccollege.edu" },
    { title: "Acoustic Night", category: "Music", description: "An evening of live acoustic performances by student bands and solo artists.", days: 8, venue: "Open Air Theatre", organizer: "Music Club", max: 200, rules: "Sign up slots available at the music club.", contact: "music@abccollege.edu" },
    { title: "Lens & Light Photography Contest", category: "Photography", description: "Photography contest on the theme 'Campus Life'.", days: 14, venue: "Online Submission", organizer: "Photography Club", max: 100, rules: "Max 3 entries per participant.", contact: "photo@abccollege.edu" },
    { title: "Startup Pitch Fest", category: "Entrepreneurship", description: "Students pitch their startup ideas to a panel of industry mentors.", days: -3, venue: "Innovation Lab", organizer: "E-Cell ABC College", max: 40, rules: "5-minute pitch + 3-minute Q&A.", contact: "ecell@abccollege.edu", completed: true },
    { title: "Civil Engineering Site Visit Briefing", category: "Department Events", description: "Pre-visit briefing session for the upcoming industrial site visit.", days: -10, venue: "Civil Dept. Seminar Room", organizer: "Dept. of Civil Engineering", max: 70, rules: "Attendance compulsory for final years.", contact: "civil@abccollege.edu", completed: true },
  ];

  const events = [];
  for (const def of eventDefs) {
    const date = daysFromNow(def.days);
    const deadline = daysFromNow(def.days - 2, 23);
    let status = "Registration Open";
    if (def.completed) status = "Completed";
    else if (def.days > 14) status = "Upcoming";

    const event = await Event.create({
      title: def.title,
      description: def.description,
      category: def.category,
      date,
      startTime: "10:00",
      endTime: "17:00",
      venue: def.venue,
      organizer: def.organizer,
      maxParticipants: def.max,
      registrationDeadline: deadline,
      rules: def.rules,
      contact: def.contact,
      status,
      createdBy: admin._id,
    });
    events.push(event);
  }

  console.log("Creating sample registrations...");
  const completedEvents = events.filter((e) => e.status === "Completed");
  const openEvents = events.filter((e) => e.status !== "Completed");

  for (const student of students) {
    // Register each student for 2 open events and 1 completed event (ignore duplicates)
    const picks = [...openEvents.slice(0, 2), completedEvents[0]].filter(Boolean);
    for (const ev of picks) {
      try {
        await Registration.create({ student: student._id, event: ev._id, status: "Approved", attendance: ev.status === "Completed" });
      } catch (e) {
        // ignore duplicate key errors from the unique index
      }
    }
  }

  console.log("Creating sample feedback for completed events...");
  if (completedEvents[0]) {
    for (const student of students.slice(0, 3)) {
      try {
        await Feedback.create({
          student: student._id,
          event: completedEvents[0]._id,
          rating: [4, 5, 4][students.indexOf(student) % 3],
          comment: "Well organized event, learned a lot!",
          suggestions: "Could use a longer Q&A session next time.",
        });
      } catch (e) {}
    }
  }

  console.log("Creating announcements...");
  await Announcement.insertMany([
    { title: "Welcome to the New Academic Year!", description: "ABC College welcomes all students back for another exciting year of learning and events.", priority: "Normal", createdBy: admin._id },
    { title: "Hackathon Registrations Closing Soon", description: "Only a few slots left for CodeStorm Hackathon. Register before the deadline!", priority: "Important", createdBy: admin._id },
    { title: "Campus Closed for Maintenance", description: "The main auditorium will be closed for maintenance this weekend.", priority: "Urgent", createdBy: admin._id },
  ]);

  console.log("\nSeed complete!");
  console.log("--------------------------------------------------");
  console.log(`Admin login   -> email: ${admin.email}  password: ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
  console.log("Student login -> email: aarav@student.abccollege.edu  password: Student@123");
  console.log("--------------------------------------------------");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
