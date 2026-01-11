"use server"

import dbconnect from '@/db/dbconnect';
import UserModels from '@/models/UserModel';

import bcrypt from 'bcrypt';


export async function UserRegister(formData) {
   const name = formData.get("name");
   const email = formData.get("email");
   const password = formData.get("password");
try{
   await dbconnect(); // Ensure DB connection is established
   const existingUser = await UserModels.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }
   // Hash the password
  
   const hashedPassword = await bcrypt.hash(password, 10);

   // Create new user
   const UserRegisterpost = new UserModels({ name,email, password: hashedPassword });
   await UserRegisterpost.save();

   return { success: true, message: "Registration successful!" };
}
catch (error) {
   // Catch any error that occurs during the process and log it
   console.error("Error during user registration:", error);
   return { success: false, message: "An error occurred during registration. Please try again later." };
 }
}
