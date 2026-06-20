import { supabase } from "../lib/supabaseClient";

async function getFunctionError(error) {
  let message = error?.message || "Password change failed.";

  try {
    if (error?.context) {
      const errorBody = await error.context.json();

      message =
        errorBody?.error ||
        errorBody?.message ||
        JSON.stringify(errorBody);
    }
  } catch {
    message = error?.message || "Password change failed.";
  }

  return {
    message,
  };
}

export async function changeMyStudentPassword({
  profile,
  currentPassword,
  newPassword,
}) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  if (!profile?.email) {
    return {
      data: null,
      error: {
        message: "Student email was not found.",
      },
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      data: null,
      error: {
        message: "Current password is incorrect.",
      },
    };
  }

  const { data, error } = await supabase.functions.invoke(
    "change-student-password",
    {
      body: {
        newPassword,
      },
    }
  );

  if (error) {
    return {
      data: null,
      error: await getFunctionError(error),
    };
  }

  await supabase.auth.signInWithPassword({
    email: profile.email,
    password: newPassword,
  });

  return {
    data,
    error: null,
  };
}