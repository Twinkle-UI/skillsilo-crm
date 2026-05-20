import mongoose from "mongoose";
import dotenv from "dotenv";
import Lead from "./models/Lead.js";
import FollowUp from "./models/FollowUp.js";
import CallLog from "./models/CallLog.js";
import User from "./models/User.js";
import Setting from "./models/Setting.js";

dotenv.config();

// ========== Sample Data Generators ==========
const stages = [
  "Follow-Ups",
  "Dump",
  "Call Back Later",
  "Registration Done",
  "Not Connected",
  "Admission Done",
  "Interested for Later",
  "Not Interested",
  "Location Barrier",
  "New Leads",
];

const sources = ["Meta Ads", "Whatsapp", "Reference", "Nurture", "Botverse"];
const universities = [
  "Vikrant University",
  "Dr Preeti Global University",
  "Mahakaushal University",
];
const states = [
  "Bihar (India)",
  "Maharashtra (India)",
  "Odisha (India)",
  "Karnataka (India)",
  "Andhra Pradesh (India)",
  "Gujarat (India)",
  "Jharkhand (India)",
  "Uttar Pradesh (India)",
  "Madhya Pradesh (India)",
  "Tamil Nadu (India)",
  "Delhi (India)",
  "Punjab (India)",
  "Haryana (India)",
];
const users = [
  "Priya (SKILL01)",
  "Khushi (SKILL02)",
  "Rinku (SKILL03)",
  "Juli (SKILL04)",
  "Harsh (SKILL05)",
  "Lokender (SKILL072)",
];
const sampleNames = [
  "STUDENT",
  "SANDEEP GUPTA",
  "RAVI KUMAR",
  "POOJA SHARMA",
  "AMIT VERMA",
  "MANPREET",
  "UTPAL DPGU",
  "PRIYA SHARMA",
  "AMIT KUMAR",
  "NEHA SINGH",
  "ROHIT YADAV",
  "KAVITA RAO",
  "VIKRAM PATEL",
  "SUNITA DEVI",
  "ANIL JOSHI",
];

const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPhone = () => `+91${randInt(7000000000, 9999999999)}`;
const randEmail = (name) =>
  `${name.toLowerCase().replace(/\s+/g, "")}${randInt(100, 999)}@gmail.com`;

// ========== Generate Leads ==========
const generateLeads = (count) => {
  const leads = [];
  for (let i = 0; i < count; i++) {
    const name = randPick(sampleNames);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randInt(0, 90));

    leads.push({
      name,
      contact: randPhone(),
      email: randEmail(name),
      inquiredFor: randPick(universities),
      program: "Regular Program",
      category: Math.random() > 0.2 ? "Regular Program" : "Unknown",
      stage: randPick(stages),
      stageNote: randPick([
        "Call Disconnect",
        "Awaiting response",
        "Will call back",
        "",
      ]),
      source: randPick(sources),
      state: randPick(states),
      location: "India",
      assignedTo: randPick(users),
      callCount: randInt(0, 30),
      remark: randPick(["call cut", "interested", "not picking", ""]),
      isOwn: Math.random() > 0.7,
      createdAt,
    });
  }
  return leads;
};

// ========== Generate Follow-Ups ==========
const generateFollowUps = (count) => {
  const followUps = [];
  for (let i = 0; i < count; i++) {
    const name = randPick(sampleNames);
    const dueAt = new Date();

    const offset = randInt(-2, 7);
    dueAt.setDate(dueAt.getDate() + offset);
    dueAt.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));

    followUps.push({
      name,
      email: randEmail(name),
      phone: randPhone().replace("+91", ""),
      inquiredFor: randPick(universities),
      program: "Regular Program",
      stage: randPick(stages),
      stageNote: randPick([
        "Busy Call Back Later",
        "Awaiting documents",
        "Will confirm",
      ]),
      source: randPick(sources),
      sourceNote: randPick([
        "Department of Engineering",
        "Department of Science",
        "Department of Arts",
      ]),
      location: "India",
      locationSub: randPick(states).replace(" (India)", ""),
      assignedTo: randPick(users),
      dueAt,
      status: offset < 0 ? "missed" : "planned",
    });
  }
  return followUps;
};

// ========== Generate Call Logs ==========
const generateCallLogs = (count) => {
  const types = ["outgoing", "missed", "incoming", "rejected"];
  const weights = [0.85, 0.05, 0.08, 0.02];

  const logs = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let acc = 0;
    let type = "outgoing";
    for (let j = 0; j < types.length; j++) {
      acc += weights[j];
      if (r < acc) {
        type = types[j];
        break;
      }
    }

    const callDate = new Date();
    callDate.setDate(callDate.getDate() - randInt(0, 90));

    logs.push({
      type,
      duration:
        type === "outgoing" || type === "incoming" ? randInt(10, 300) : 0,
      callDate,
    });
  }
  return logs;
};

// ========== Default Settings Data ==========
const defaultSettings = [
  // Universities
  { type: "university", name: "Vikrant University" },
  { type: "university", name: "Mahakaushal University" },
  { type: "university", name: "Dr.Preeti Global University" },
  { type: "university", name: "Glocal University" },
  { type: "university", name: "GLA University" },
  { type: "university", name: "Mangalayatan University" },
  { type: "university", name: "Chandigarh University" },

  // Courses
  // Courses (image jaise)
  { type: "course", name: "b.tech_engineering" },
  { type: "course", name: "Unknown" },
  { type: "course", name: "B.Com" },
  { type: "course", name: "MA" },
  { type: "course", name: "BA" },
  { type: "course", name: "MBA" },
  { type: "course", name: "M.Tech" },
  { type: "course", name: "Diploma" },

  // Stages
  // Stages with flags (image jaise)
  { type: "stage", name: "New Leads", isInitial: true },
  { type: "stage", name: "Opportunities" },
  { type: "stage", name: "Re-inquired", isReEnquired: true },
  { type: "stage", name: "Admission Done", isFinal: true },
  { type: "stage", name: "Not Connected" },
  { type: "stage", name: "Not Interested" },
  { type: "stage", name: "Dump" },
  { type: "stage", name: "Documents Received" },
  { type: "stage", name: "Follow-Ups" },
  { type: "stage", name: "Location Barrier" },
  { type: "stage", name: "Call Back Later" },
  { type: "stage", name: "Interested for Later" },
  { type: "stage", name: "Registration Done" },

  // Reasons

  // Sources
  { type: "source", name: "Meta Ads" },
  { type: "source", name: "Whatsapp" },
  { type: "source", name: "Reference" },
  { type: "source", name: "Nurture" },
  { type: "source", name: "Botverse" },

  // Sub-Sources

  // States

  // Cities

  // Countries
  { type: "country", name: "India" },
  { type: "country", name: "Nepal" },
  { type: "country", name: "Bangladesh" },

  // Email Templates
];

// Categories (Universities ke saath linked) - separately handle
const categoryLinks = [
  { name: "Regular Program", university: "Vikrant University" },
  { name: "Regular Program", university: "Mahakaushal University" },
  { name: "Regular Program", university: "Dr.Preeti Global University" },
  { name: "Regular Programs", university: "Glocal University" },
  { name: "Online Programs", university: "Chandigarh University" },
  { name: "Online Programs", university: "Mangalayatan University" },
  { name: "Distance Learning", university: "GLA University" },
];

// Reasons (Stages ke saath linked) - image jaise
const reasonLinks = [
  { name: "Make First Call", stage: "New Leads" },
  { name: "Hot", stage: "Follow-Ups" },
  { name: "Cold", stage: "Follow-Ups" },
  { name: "Fee Paid", stage: "Admission Done" },
  { name: "Partial Fee Paid", stage: "Admission Done" },
  { name: "Call Not Picked", stage: "Not Connected" },
  { name: "Not Reachable", stage: "Not Connected" },
  { name: "Already taken Admission Elsewhere", stage: "Dump" },
  { name: "Interested for other Program", stage: "Not Interested" },
];
// Sub-Sources (Sources ke saath linked) - image jaise
const subSourceLinks = [
  { name: "Department of Engineering", source: "Meta Ads" },
  { name: "Reference", source: "Reference" },
];
// States (Countries ke saath linked) - Indian states
const stateLinks = [
  { name: "Bihar", country: "India" },
  { name: "Maharashtra", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Karnataka", country: "India" },
  { name: "Gujarat", country: "India" },
  { name: "Punjab", country: "India" },
  { name: "Haryana", country: "India" },
  { name: "Uttar Pradesh", country: "India" },
  { name: "Tamil Nadu", country: "India" },
  { name: "West Bengal", country: "India" },
];
// Cities (States ke saath linked) - Indian cities
const cityLinks = [
  { name: "Patna", state: "Bihar" },
  { name: "Gaya", state: "Bihar" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "New Delhi", state: "Delhi" },
  { name: "Bangalore", state: "Karnataka" },
  { name: "Mysore", state: "Karnataka" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Surat", state: "Gujarat" },
  { name: "Chandigarh", state: "Punjab" },
  { name: "Amritsar", state: "Punjab" },
  { name: "Gurgaon", state: "Haryana" },
  { name: "Faridabad", state: "Haryana" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Kanpur", state: "Uttar Pradesh" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Coimbatore", state: "Tamil Nadu" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Howrah", state: "West Bengal" },
];
// Email Templates (linked to Universities/Departments)
const emailTemplates = [
  {
    name: "Welcome Email",
    subject: "Welcome to Vikrant University!",
    body: "Dear {{name}},\n\nWelcome to Vikrant University! We're excited to have you join our academic community.\n\nYour application is being processed. Our admissions team will contact you within 24 hours.\n\nBest regards,\nAdmissions Team\nVikrant University",
    department: "Vikrant University",
  },
  {
    name: "Follow-up Reminder",
    subject: "Following up on your application - {{course}}",
    body: "Hi {{name}},\n\nWe noticed you started an application for {{course}} but haven't completed it yet.\n\nWe're here to help! If you have any questions, feel free to reply to this email or call us.\n\nApplication Link: {{link}}\n\nRegards,\nAdmissions Team",
    department: "Mahakaushal University",
  },
  {
    name: "Document Request",
    subject: "Documents Required - Action Needed",
    body: "Dear {{name}},\n\nThank you for your application. To proceed further, please submit the following documents:\n\n1. 10th & 12th Mark Sheets\n2. Aadhaar Card Copy\n3. Recent Photograph\n4. Address Proof\n\nUpload them at: {{upload_link}}\n\nDeadline: {{deadline}}\n\nBest regards,\nAdmissions Office",
    department: "Dr.Preeti Global University",
  },
  {
    name: "Admission Confirmation",
    subject: "Congratulations! Your Admission is Confirmed",
    body: "Dear {{name}},\n\nWe are pleased to inform you that your admission to {{course}} at Vikrant University has been confirmed.\n\nNext Steps:\n- Pay the first installment of fees\n- Submit required documents\n- Attend the orientation on {{date}}\n\nWelcome aboard!\n\nRegards,\nVikrant University Admissions",
    department: "Vikrant University",
  },
];
// SMS Templates (linked to Universities/Departments)
const smsTemplates = [
  {
    name: "Welcome SMS",
    templateId: "1207161780123456789",
    body: "Hi {{name}}, welcome to Vikrant University! Your application is being processed. Team will contact you soon. -Vikrant Univ",
    department: "Vikrant University",
  },
  {
    name: "OTP Verification",
    templateId: "1207161780987654321",
    body: "Your OTP for {{university}} application is {{otp}}. Valid for 10 minutes. Do not share with anyone.",
    department: "Mahakaushal University",
  },
  {
    name: "Admission Confirmation",
    templateId: "1207161781111222333",
    body: "Congratulations {{name}}! Your admission to {{course}} is confirmed. Pay first installment at {{link}} -Vikrant",
    department: "Vikrant University",
  },
  {
    name: "Payment Reminder",
    templateId: "1207161782222333444",
    body: "Hi {{name}}, kindly complete your fee payment of Rs.{{amount}} by {{date}}. Pay now: {{link}} -DPGU",
    department: "Dr.Preeti Global University",
  },
];
// WhatsApp Templates (linked to Universities/Departments) - image jaise
const whatsappTemplates = [
  {
    name: "Admission Closing Date",
    body: "Hi {{name}}, this is a reminder that the admission closing date for {{course}} at Vikrant University is {{date}}. Apply now to secure your seat! Reply YES to get the application link.",
    department: "Vikrant University",
  },
  {
    name: "Not Connected",
    body: "Hi {{name}}, we tried calling you regarding your enquiry at Vikrant University but couldn't connect. Please share a convenient time to call you back, or reply CALL to schedule.",
    department: "Vikrant University",
  },
];
// Sample Users (image jaise)
const sampleUsers = [
  {
    name: "Hitesh Singh",
    email: "hitesh.doubtsclear@gmail.com",
    employeeId: "SKILL036",
    password: "skill123",
    role: "team_lead",
    departmentNames: [
      "Vikrant University",
      "Mahakaushal University",
      "Dr.Preeti Global University",
      "Glocal University",
      "GLA University",
      "Mangalayatan University",
      "Chandigarh University",
    ],
    isActive: true,
  },
  {
    name: "Manager",
    email: "ishugupta@doubtsclear.com",
    employeeId: "Skill0001",
    password: "manager123",
    role: "manager",
    departmentNames: [
      "Vikrant University",
      "Mahakaushal University",
      "Dr.Preeti Global University",
      "Glocal University",
      "GLA University",
      "Mangalayatan University",
    ],
    isActive: false,
  },
  {
    name: "Priya Sharma",
    email: "priya@skillsilo.com",
    employeeId: "SKILL001",
    password: "priya123",
    role: "employee",
    departmentNames: ["Vikrant University"],
    isActive: true,
  },
  {
    name: "Khushi Patel",
    email: "khushi@skillsilo.com",
    employeeId: "SKILL002",
    password: "khushi123",
    role: "employee",
    departmentNames: ["Mahakaushal University"],
    isActive: true,
  },
];
// ========== Run Seed ==========
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🗑️  Clearing existing data...");
    await Lead.deleteMany();
    await FollowUp.deleteMany();
    await CallLog.deleteMany();
    await Setting.deleteMany();
    await User.deleteMany();

    console.log("🌱 Inserting Leads...");
    await Lead.insertMany(generateLeads(200));

    console.log("🌱 Inserting Follow-Ups...");
    await FollowUp.insertMany(generateFollowUps(50));

    console.log("🌱 Inserting Call Logs...");
    await CallLog.insertMany(generateCallLogs(1500));

    console.log("🌱 Creating default admin user...");
    await User.create({
      name: "Admin",
      email: "admin@skillsilo.com",
      employeeId: "ADMIN001",
      password: "admin123",
      role: "admin",
    });

    console.log("🌱 Inserting Settings (Universities first)...");

    // Step 1: Universities insert karo, unki IDs save karo
    const universityData = defaultSettings.filter(
      (s) => s.type === "university",
    );
    const insertedUniversities = await Setting.insertMany(universityData);

    // University name → _id ka map banao
    const uniMap = {};
    insertedUniversities.forEach((u) => {
      uniMap[u.name] = u._id;
    });

    // Step 2: Categories - universities ke saath linked
    const categoryData = categoryLinks.map((c) => ({
      type: "category",
      name: c.name,
      parentId: uniMap[c.university] || null,
      isActive: true,
    }));
    await Setting.insertMany(categoryData);

    // Step 3: Insert all non-university, non-course settings
    const otherSettings = defaultSettings.filter(
      (s) => s.type !== "university" && s.type !== "course",
    );
    await Setting.insertMany(otherSettings);

    // Step 4: Courses ko Categories ke saath link karo
    // Sab courses ko first category (Regular Program of Vikrant University) ke saath linke karte hain
    const insertedCategories = await Setting.find({ type: "category" });

    // Vikrant University wali Regular Program category dhundo
    const vikrantUniId = uniMap["Vikrant University"];
    const vikrantRegularCategory = insertedCategories.find(
      (c) =>
        c.name === "Regular Program" &&
        c.parentId?.toString() === vikrantUniId?.toString(),
    );

    const courseList = defaultSettings.filter((s) => s.type === "course");
    const courseData = courseList.map((c) => ({
      type: "course",
      name: c.name,
      parentId: vikrantRegularCategory?._id || null,
      isActive: true,
    }));
    // Step 5: Reasons ko Stages ke saath link karo
    const insertedStages = await Setting.find({ type: "stage" });
    const stageMap = {};
    insertedStages.forEach((s) => {
      stageMap[s.name] = s._id;
    });

    const reasonData = reasonLinks.map((r) => ({
      type: "reason",
      name: r.name,
      parentId: stageMap[r.stage] || null,
      isActive: true,
    }));
    await Setting.insertMany(reasonData);
    // Step 6: Sub-Sources ko Sources ke saath link karo
    const insertedSources = await Setting.find({ type: "source" });
    const sourceMap = {};
    insertedSources.forEach((s) => {
      sourceMap[s.name] = s._id;
    });

    const subSourceData = subSourceLinks.map((sub) => ({
      type: "subsource",
      name: sub.name,
      parentId: sourceMap[sub.source] || null,
      isActive: true,
    }));
    await Setting.insertMany(subSourceData);
    // Step 7: States ko Countries ke saath link karo
    const insertedCountries = await Setting.find({ type: "country" });
    const countryMap = {};
    insertedCountries.forEach((c) => {
      countryMap[c.name] = c._id;
    });

    const stateData = stateLinks.map((s) => ({
      type: "state",
      name: s.name,
      parentId: countryMap[s.country] || null,
      isActive: true,
    }));
    await Setting.insertMany(stateData);
    // Step 8: Cities ko States ke saath link karo
    const insertedStatesNew = await Setting.find({ type: "state" });
    const stateMapForCities = {};
    insertedStatesNew.forEach((s) => {
      stateMapForCities[s.name] = s._id;
    });

    const cityData = cityLinks.map((c) => ({
      type: "city",
      name: c.name,
      parentId: stateMapForCities[c.state] || null,
      isActive: true,
    }));
    await Setting.insertMany(cityData);
    // Step 9: Email Templates ko Universities (Departments) ke saath link karo
    const emailTemplateData = emailTemplates.map((t) => ({
      type: "email_template",
      name: t.name,
      subject: t.subject,
      body: t.body,
      parentId: uniMap[t.department] || null,
      isActive: true,
    }));
    await Setting.insertMany(emailTemplateData);
    // Step 10: SMS Templates ko Universities ke saath link karo
    const smsTemplateData = smsTemplates.map((t) => ({
      type: "sms_template",
      name: t.name,
      templateId: t.templateId,
      body: t.body,
      parentId: uniMap[t.department] || null,
      isActive: true,
    }));
    await Setting.insertMany(smsTemplateData);
    // Step 11: WhatsApp Templates ko Universities ke saath link karo
    const whatsappTemplateData = whatsappTemplates.map((t) => ({
      type: "whatsapp_template",
      name: t.name,
      body: t.body,
      parentId: uniMap[t.department] || null,
      isActive: true,
    }));
    await Setting.insertMany(whatsappTemplateData);
    // Step 12: Sample Users create karo (department IDs ke saath)
    console.log("🌱 Creating sample users...");
    for (const userData of sampleUsers) {
      // department names → IDs convert karo
      const departmentIds = userData.departmentNames
        .map((name) => uniMap[name])
        .filter(Boolean); // null/undefined remove karo

      await User.create({
        name: userData.name,
        email: userData.email,
        employeeId: userData.employeeId,
        password: userData.password,
        role: userData.role,
        departments: departmentIds,
        isActive: userData.isActive,
      });
    }
    await Setting.insertMany(courseData);

    const totalSettings =
      insertedUniversities.length + categoryData.length + otherSettings.length;

    console.log("✅ Seed complete!");
    console.log("   - 200 leads");
    console.log("   - 50 follow-ups");
    console.log("   - 1500 call logs");
    console.log(
      `   - ${1 + sampleUsers.length} users (admin + ${sampleUsers.length} sample)`,
    );
    console.log(`   - ${totalSettings} settings (with category links)`);
    console.log("");
    console.log("🔑 Login credentials:");
    console.log("   Email: admin@skillsilo.com");
    console.log("   Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedDB();
