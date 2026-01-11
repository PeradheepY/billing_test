// app/api/logout/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear any authentication cookies
    // Replace 'auth-token' with whatever cookie name you're using for authentication
    cookieStore.delete('admintoken');
    
  
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Logged out successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to logout' 
      },
      { status: 500 }
    );
  }
}