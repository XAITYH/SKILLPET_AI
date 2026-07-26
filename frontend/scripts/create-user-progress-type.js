/**
 * Script to create user-progress content type in Strapi
 * Run: node scripts/create-user-progress-type.js
 */

const STRAPI_URL = "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function createContentType() {
  const schema = {
    collectionName: "user_progresses",
    info: {
      singularName: "user-progress",
      pluralName: "user-progresses",
      displayName: "User Progress",
    },
    options: {
      draftAndPublish: false,
    },
    pluginOptions: {},
    attributes: {
      appUser: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      course: {
        type: "relation",
        relation: "manyToOne",
        target: "api::course.course",
      },
      completedChapters: {
        type: "json",
        default: [],
      },
      gems: {
        type: "integer",
        default: 0,
      },
      hearts: {
        type: "integer",
        default: 10,
      },
      streakDays: {
        type: "integer",
        default: 0,
      },
      lastActive: {
        type: "datetime",
      },
      lastStreak: {
        type: "string",
      },
    },
  };

  console.log("Creating user-progress content type...");
  console.log("Please create this content type manually in Strapi admin panel:");
  console.log("1. Go to Content-Type Builder");
  console.log("2. Create new collection type named 'User Progress'");
  console.log("3. Add fields:");
  console.log("   - appUser (Relation -> manyToOne -> User)");
  console.log("   - course (Relation -> manyToOne -> Course)");
  console.log("   - completedChapters (JSON)");
  console.log "   - gems (Integer, default 0)");
  console.log("   - hearts (Integer, default 10)");
  console.log("   - streakDays (Integer, default 0)");
  console.log("   - lastActive (DateTime)");
  console.log("   - lastStreak (String)");
  console.log("\n4. Save and restart Strapi");
}

createContentType().catch(console.error);
