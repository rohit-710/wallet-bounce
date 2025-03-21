import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

// Connect to Solana devnet
const connection = new Connection('https://api.devnet.solana.com');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get('signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Transaction signature is required' },
        { status: 400 }
      );
    }

    // Get transaction status
    const status = await connection.getSignatureStatus(signature);
    
    if (!status.value) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Transaction not found'
      });
    }

    const isConfirmed = status.value.confirmationStatus === 'confirmed' || 
                       status.value.confirmationStatus === 'finalized';

    return NextResponse.json({
      success: true,
      status: status.value.confirmationStatus,
      isConfirmed,
      message: isConfirmed ? 'Transaction confirmed' : 'Transaction pending'
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return NextResponse.json(
      { error: 'Failed to check transaction status' },
      { status: 500 }
    );
  }
} 