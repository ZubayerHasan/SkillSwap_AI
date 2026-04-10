const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const SkillTaxonomy = require("../models/SkillTaxonomy.model");

const SKILLS = [
  // Programming
  { canonicalName: "javascript", displayName: "JavaScript", aliases: ["js"], category: "Programming", slug: "javascript" },
  { canonicalName: "typescript", displayName: "TypeScript", aliases: ["ts"], category: "Programming", slug: "typescript" },
  { canonicalName: "python", displayName: "Python", aliases: ["py", "python3"], category: "Programming", slug: "python" },
  { canonicalName: "java", displayName: "Java", aliases: [], category: "Programming", slug: "java" },
  { canonicalName: "c++", displayName: "C++", aliases: ["cpp", "cplusplus"], category: "Programming", slug: "cpp" },
  { canonicalName: "c#", displayName: "C#", aliases: ["csharp", "c_sharp", "dotnet"], category: "Programming", slug: "csharp" },
  { canonicalName: "go", displayName: "Go (Golang)", aliases: ["golang"], category: "Programming", slug: "go" },
  { canonicalName: "rust", displayName: "Rust", aliases: [], category: "Programming", slug: "rust" },
  { canonicalName: "react", displayName: "React.js", aliases: ["reactjs", "react.js"], category: "Programming", slug: "react" },
  { canonicalName: "node", displayName: "Node.js", aliases: ["nodejs", "node.js"], category: "Programming", slug: "nodejs" },
  { canonicalName: "sql", displayName: "SQL", aliases: ["mysql", "postgres", "postgresql"], category: "Programming", slug: "sql" },
  { canonicalName: "mongodb", displayName: "MongoDB", aliases: ["mongo"], category: "Programming", slug: "mongodb" },
  { canonicalName: "docker", displayName: "Docker", aliases: ["containerization"], category: "Programming", slug: "docker" },
  { canonicalName: "git", displayName: "Git & GitHub", aliases: ["github", "version control"], category: "Programming", slug: "git" },
  { canonicalName: "machine learning", displayName: "Machine Learning", aliases: ["ml", "ai"], category: "Programming", slug: "machine-learning" },
  { canonicalName: "data science", displayName: "Data Science", aliases: ["data analysis"], category: "Programming", slug: "data-science" },
  // Design
  { canonicalName: "figma", displayName: "Figma", aliases: ["ui design", "ux design"], category: "Design", slug: "figma" },
  { canonicalName: "adobe photoshop", displayName: "Adobe Photoshop", aliases: ["photoshop", "ps"], category: "Design", slug: "photoshop" },
  { canonicalName: "adobe illustrator", displayName: "Adobe Illustrator", aliases: ["illustrator", "ai"], category: "Design", slug: "illustrator" },
  { canonicalName: "ui/ux design", displayName: "UI/UX Design", aliases: ["user interface design", "user experience"], category: "Design", slug: "ui-ux-design" },
  { canonicalName: "graphic design", displayName: "Graphic Design", aliases: ["graphic"], category: "Design", slug: "graphic-design" },
  { canonicalName: "logo design", displayName: "Logo Design", aliases: [], category: "Design", slug: "logo-design" },
  { canonicalName: "3d modeling", displayName: "3D Modeling", aliases: ["blender", "3d design"], category: "Design", slug: "3d-modeling" },
  // Music
  { canonicalName: "guitar", displayName: "Guitar", aliases: ["acoustic guitar", "electric guitar"], category: "Music", slug: "guitar" },
  { canonicalName: "piano", displayName: "Piano / Keyboard", aliases: ["keyboard", "piano"], category: "Music", slug: "piano" },
  { canonicalName: "music production", displayName: "Music Production", aliases: ["fl studio", "ableton", "beat making"], category: "Music", slug: "music-production" },
  { canonicalName: "singing", displayName: "Singing / Vocals", aliases: ["vocals", "voice"], category: "Music", slug: "singing" },
  { canonicalName: "music theory", displayName: "Music Theory", aliases: [], category: "Music", slug: "music-theory" },
  // Languages
  { canonicalName: "english", displayName: "English", aliases: ["english language", "ielts"], category: "Languages", slug: "english" },
  { canonicalName: "arabic", displayName: "Arabic", aliases: [], category: "Languages", slug: "arabic" },
  { canonicalName: "french", displayName: "French", aliases: ["français"], category: "Languages", slug: "french" },
  { canonicalName: "spanish", displayName: "Spanish", aliases: ["español"], category: "Languages", slug: "spanish" },
  { canonicalName: "mandarin", displayName: "Mandarin Chinese", aliases: ["chinese", "mandarin chinese"], category: "Languages", slug: "mandarin" },
  { canonicalName: "japanese", displayName: "Japanese", aliases: [], category: "Languages", slug: "japanese" },
  // Math/Science
  { canonicalName: "calculus", displayName: "Calculus", aliases: ["math", "maths"], category: "Math/Science", slug: "calculus" },
  { canonicalName: "linear algebra", displayName: "Linear Algebra", aliases: [], category: "Math/Science", slug: "linear-algebra" },
  { canonicalName: "statistics", displayName: "Statistics", aliases: ["stats"], category: "Math/Science", slug: "statistics" },
  { canonicalName: "physics", displayName: "Physics", aliases: [], category: "Math/Science", slug: "physics" },
  { canonicalName: "chemistry", displayName: "Chemistry", aliases: [], category: "Math/Science", slug: "chemistry" },
  // Video/Media
  { canonicalName: "video editing", displayName: "Video Editing", aliases: ["premiere pro", "final cut", "davinci resolve"], category: "Video/Media", slug: "video-editing" },
  { canonicalName: "photography", displayName: "Photography", aliases: ["photo editing", "lightroom"], category: "Video/Media", slug: "photography" },
  { canonicalName: "animation", displayName: "Animation", aliases: ["motion graphics", "after effects"], category: "Video/Media", slug: "animation" },
  { canonicalName: "youtube", displayName: "YouTube Content Creation", aliases: ["content creation", "vlogging"], category: "Video/Media", slug: "youtube" },
  // Writing
  { canonicalName: "academic writing", displayName: "Academic Writing", aliases: ["research writing", "essay writing"], category: "Writing", slug: "academic-writing" },
  { canonicalName: "creative writing", displayName: "Creative Writing", aliases: ["fiction", "storytelling"], category: "Writing", slug: "creative-writing" },
  { canonicalName: "copywriting", displayName: "Copywriting", aliases: ["content writing", "blogging"], category: "Writing", slug: "copywriting" },
  { canonicalName: "proofreading", displayName: "Proofreading & Editing", aliases: ["editing", "grammar"], category: "Writing", slug: "proofreading" },
  // Business
  { canonicalName: "public speaking", displayName: "Public Speaking", aliases: ["presentation skills", "communication"], category: "Business", slug: "public-speaking" },
  { canonicalName: "digital marketing", displayName: "Digital Marketing", aliases: ["social media marketing", "seo"], category: "Business", slug: "digital-marketing" },
  { canonicalName: "entrepreneurship", displayName: "Entrepreneurship", aliases: ["startup", "business planning"], category: "Business", slug: "entrepreneurship" },
  { canonicalName: "project management", displayName: "Project Management", aliases: ["agile", "scrum", "pmp"], category: "Business", slug: "project-management" },
  { canonicalName: "finance", displayName: "Personal Finance", aliases: ["financial literacy", "investing", "budgeting"], category: "Business", slug: "finance" },
];

const seedTaxonomy = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding...");

  let created = 0;
  let skipped = 0;

  for (const skill of SKILLS) {
    try {
      await SkillTaxonomy.findOneAndUpdate(
        { slug: skill.slug },
        skill,
        { upsert: true, new: true }
      );
      created++;
    } catch (err) {
      console.error(`Error seeding ${skill.canonicalName}:`, err.message);
      skipped++;
    }
  }

  console.log(`✅ Taxonomy seeded: ${created} skills created/updated, ${skipped} errors`);
  await mongoose.disconnect();
  process.exit(0);
};

seedTaxonomy().catch(console.error);
