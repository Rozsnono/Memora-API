const { MongoClient } = require('mongodb');

async function migrate() {
    const clusterUri = "mongodb+srv://admin:admin@personalthings.whiebq7.mongodb.net/?retryWrites=true&appName=PersonalThings";
    const client = new MongoClient(clusterUri);

    console.log("Connecting to MongoDB cluster...");
    await client.connect();

    const sourceDb = client.db("memoryes");
    const targetDb = client.db("memora");

    console.log(`Source DB: ${sourceDb.databaseName}`);
    console.log(`Target DB: ${targetDb.databaseName}`);

    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in memoryes:`, collections.map(c => c.name));

    for (const colInfo of collections) {
        const colName = colInfo.name;
        console.log(`\n--- Migrating collection: ${colName} ---`);

        const sourceCol = sourceDb.collection(colName);
        const targetCol = targetDb.collection(colName);

        const docs = await sourceCol.find({}).toArray();
        console.log(`  Read ${docs.length} documents from memoryes.${colName}`);

        if (docs.length === 0) {
            console.log(`  No documents to migrate.`);
            continue;
        }

        // Process special fields
        const processedDocs = docs.map(doc => {
            if (colName === 'users') {
                // Assign admin role to Norbi (rozsnono@gmail.com)
                if (doc.email?.toLowerCase() === 'rozsnono@gmail.com') {
                    doc.role = 'admin';
                } else if (!doc.role) {
                    doc.role = 'user';
                }
            }
            return doc;
        });

        // Insert or Upsert into target database
        let inserted = 0;
        let updated = 0;
        for (const doc of processedDocs) {
            const res = await targetCol.replaceOne(
                { _id: doc._id },
                doc,
                { upsert: true }
            );
            if (res.upsertedCount > 0) inserted++;
            else updated++;
        }

        console.log(`  Finished ${colName}: ${inserted} inserted, ${updated} updated.`);
    }

    console.log("\n=================================");
    console.log("Migration verification in memora:");
    const targetCols = await targetDb.listCollections().toArray();
    for (const c of targetCols) {
        const count = await targetDb.collection(c.name).countDocuments();
        console.log(`  memora.${c.name}: ${count} documents`);
    }

    await client.close();
    console.log("Migration complete!");
}

migrate().catch(console.error);
