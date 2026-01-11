"use server";

import dbconnect from '@/db/dbconnect';
import bcrypt from 'bcrypt';
import { cookies } from "next/headers";
import UserModel from '@/models/UserModel';
import { createToken } from '@/lib/jwt';

export async function userLogin(formData) {
  try {
    await dbconnect();

    const email = formData.get("email");
    const password = formData.get("password");

    const user = await UserModel.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid password." };
    }

    const token = await createToken({ 
      userId: user._id.toString(),
      role: 'user',
      email: user.email 
    });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      maxAge: 60 * 60,
      path: '/'
    });

    return { 
      success: true, 
      message: "Login successful!",
      userId: user._id.toString(),
      role: 'user',
      email: user.email
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: "An error occurred during login." };
  }
}

export async function adminLogin(formData) {
  try {
    await dbconnect();

    const email = formData.get("email");
    const password = formData.get("password");

    const admin = await UserModel.findOne({ email });
    if (!admin) {
      return { success: false, message: "Admin not found." };
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid password." };
    }

    const token = await createToken({ 
      adminId: admin._id.toString(),
      role: 'admin',
      email: admin.email 
    });

    const cookieStore = await cookies();
    cookieStore.set('admintoken', token, {
      httpOnly: true,
      maxAge: 60 * 60,
      path: '/'
    });

    return { 
      success: true, 
      message: "Admin login successful!",
      adminId: admin._id.toString(),
      role: 'admin',
      email: admin.email
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, message: "An error occurred during login." };
  }
}

export async function logout(type = 'user') {
  const cookieStore = cookies();
  cookieStore.delete(type === 'admin' ? 'admintoken' : 'token');
  return { success: true, message: "Logged out successfully" };
}