import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const newPassword = process.env.NEW_ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !newPassword) {
  console.error(
    "Missing one of: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, NEW_ADMIN_PASSWORD"
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
  const targetEmail = String(email).trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users || [];
    const foundUser = users.find(
      (user) => String(user.email || "").trim().toLowerCase() === targetEmail
    );

    if (foundUser) {
      return foundUser;
    }

    if (users.length < 1000) {
      break;
    }
  }

  return null;
}

const user = await findUserByEmail(adminEmail);

if (!user) {
  console.error("No auth user found for email:", adminEmail);
  process.exit(1);
}

console.log("Found auth user:", user.email);
console.log("User ID:", user.id);

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
  password: newPassword,
  email_confirm: true,
  user_metadata: {
    full_name: "Johnpaul Udonte",
    role: "admin",
  },
});

if (error) {
  console.error("Password reset failed:", error.message);
  process.exit(1);
}

console.log("Admin password reset successful for:", data.user.email);
console.log("You can now login with the new password.");