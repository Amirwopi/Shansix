#!/usr/bin/env bun

/**
 * Database Initialization Script
 * 
 * This script initializes the database with default lottery settings
 * Run this after setting up the database for the first time
 */

import { db } from '../src/lib/db';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...\n');

    // Check if lottery settings already exist
    const existingSettings = await db.lotterySettings.findFirst();

    if (existingSettings) {
      console.log('⚠️  Lottery settings already exist:');
      console.log(`   - Capacity: ${existingSettings.capacity}`);
      console.log(`   - Entry Price: ${existingSettings.entryPrice} Toman`);
      console.log(`   - Winners Count: ${existingSettings.winnersCount}`);
      console.log(`   - Status: ${existingSettings.status}`);
      
      const update = process.argv.includes('--update');
      
      if (update) {
        console.log('\n🔄 Updating lottery settings...\n');
        
        await db.lotterySettings.update({
          where: { id: existingSettings.id },
          data: {
            capacity: 1000,
            entryPrice: 50000n,
            winnersCount: 1,
            status: 'OPEN',
          },
        });
        
        console.log('✅ Lottery settings updated successfully!');
      } else {
        console.log('\n💡 Use --update flag to update existing settings');
      }
    } else {
      // Create default lottery settings
      console.log('📝 Creating default lottery settings...\n');

      await db.lotterySettings.create({
        data: {
          capacity: 1000,
          entryPrice: 50000n,
          winnersCount: 1,
          status: 'OPEN',
        },
      });

      console.log('✅ Default lottery settings created:');
      console.log(`   - Capacity: 1000 participants`);
      console.log(`   - Entry Price: 50,000 Toman`);
      console.log(`   - Winners Count: 1`);
      console.log(`   - Status: OPEN`);
    }

    // Display statistics
    console.log('\n📊 Current database statistics:\n');

    const userCount = await db.user.count();
    const paymentCount = await db.payment.count();
    const codeCount = await db.lotteryCode.count();
    const winnerCount = await db.winner.count();

    console.log(`   👥 Users: ${userCount}`);
    console.log(`   💳 Payments: ${paymentCount}`);
    console.log(`   🎫 Lottery Codes: ${codeCount}`);
    console.log(`   🏆 Winners: ${winnerCount}`);

    console.log('\n✨ Database initialization completed!\n');
    console.log('💡 Next steps:');
    console.log('   1. Set up your environment variables in .env');
    console.log('   2. Configure Melipayamak SMS settings');
    console.log('   3. Configure ZarinPal payment gateway');
    console.log('   4. Run the development server: bun run dev');
    console.log('   5. Access the application at http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the initialization
initializeDatabase();
