import { NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Connect to Solana devnet
const connection = new Connection('https://api.devnet.solana.com');

// Get treasury private key from environment variable
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
if (!TREASURY_PRIVATE_KEY) {
  throw new Error('TREASURY_PRIVATE_KEY environment variable is not set');
}

// Convert base58 private key to Uint8Array
const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(TREASURY_PRIVATE_KEY));

export async function POST(request: Request) {
  try {
    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Create transaction to transfer 0.01 SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: new PublicKey(playerAddress),
        lamports: 10000000, // 0.01 SOL
      })
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = treasuryKeypair.publicKey;

    // Sign transaction with treasury keypair
    transaction.sign(treasuryKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error('Error processing reward claim:', error);
    return NextResponse.json(
      { error: 'Failed to process reward claim' },
      { status: 500 }
    );
  }
} 