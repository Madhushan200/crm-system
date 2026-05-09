import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Demo credentials - in production use a real database
    const users = [
      { id: 1, username: "admin", password: "admin123", role: "admin" },
      { id: 2, username: "counsellor1", password: "123456", role: "counsellor" },
    ];

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} login successful`,
        token,
        role: user.role,
      },
      { status: 200 }
    );

    response.cookies.set("crm_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
