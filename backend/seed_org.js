'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.dev') });
const mongoose = require('mongoose');
const Organization = require('./server/Project/Organizations/models/organization.model');

const mongoURI = process.env.MONGODB;

async function seedOrganizations() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing organizations
        await Organization.deleteMany({});
        console.log('🗑️  Cleared existing organizations');

        const orgs = [
            {
                _id: new mongoose.Types.ObjectId("69baf8349050b9215c700b96"),
                title: [
                    { key: 'en', value: 'General' },
                    { key: 'th', value: 'ทั่วไป' }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Digital University' },
                    { key: 'th', value: 'มหาวิทยาลัยดิจิทัล' }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Academic Affairs' },
                    { key: 'th', value: 'ฝ่ายวิชาการ' }
                ]
            },
            {
                title: [
                    { key: 'en', value: 'Student Affairs' },
                    { key: 'th', value: 'ฝ่ายกิจการนักศึกษา' }
                ]
            }
        ];

        const createdOrgs = await Organization.insertMany(orgs);
        console.log(`✅ Successfully seeded ${createdOrgs.length} organizations:`);
        createdOrgs.forEach(org => {
            const thTitle = org.title.find(t => t.key === 'th')?.value || 'N/A';
            console.log(` - ID: ${org._id} | Title(TH): ${thTitle}`);
        });

    } catch (error) {
        console.error('❌ Error seeding organizations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

seedOrganizations();
