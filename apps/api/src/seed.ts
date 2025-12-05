import { db } from "./db/client";
import { users, touristSpots, lodgings, ratings } from "./db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create a test user
    console.log("Creating test user...");
    const [user] = await db
      .insert(users)
      .values({
        login: "admin",
        email: "admin@tourism.com",
        passwordHash: "$2a$10$YourHashedPasswordHere", // In production, use bcrypt
        role: "ADMIN",
      })
      .onConflictDoNothing()
      .returning();

    const userId = user?.id || (await db.select().from(users).where(eq(users.email, "admin@tourism.com")).limit(1))[0].id;

    console.log("✓ User created:", userId);

    // Create sample tourist spots
    console.log("Creating tourist spots...");
    const spots = await db
      .insert(touristSpots)
      .values([
        {
          name: "Christ the Redeemer",
          description: "Iconic Art Deco statue of Jesus Christ overlooking Rio de Janeiro from atop Mount Corcovado. One of the New Seven Wonders of the World.",
          city: "Rio de Janeiro",
          state: "RJ",
          country: "Brazil",
          lat: "-22.951916",
          lng: "-43.210487",
          address: "Parque Nacional da Tijuca - Alto da Boa Vista",
          createdBy: userId,
          averageRating: "4.8",
        },
        {
          name: "Sugarloaf Mountain",
          description: "Peak rising 396 meters above the harbor with cable car access and panoramic views of Rio de Janeiro.",
          city: "Rio de Janeiro",
          state: "RJ",
          country: "Brazil",
          lat: "-22.948658",
          lng: "-43.157406",
          address: "Av. Pasteur, 520 - Urca",
          createdBy: userId,
          averageRating: "4.7",
        },
        {
          name: "Iguazu Falls",
          description: "Massive waterfall system on the border of Argentina and Brazil, one of the world's largest and most impressive waterfalls.",
          city: "Foz do Iguaçu",
          state: "PR",
          country: "Brazil",
          lat: "-25.695263",
          lng: "-54.436892",
          address: "Parque Nacional do Iguaçu",
          createdBy: userId,
          averageRating: "4.9",
        },
        {
          name: "Fernando de Noronha",
          description: "Volcanic archipelago with pristine beaches, crystal-clear waters, and incredible marine life. A UNESCO World Heritage Site.",
          city: "Fernando de Noronha",
          state: "PE",
          country: "Brazil",
          lat: "-3.854492",
          lng: "-32.426487",
          address: "Arquipélago de Fernando de Noronha",
          createdBy: userId,
          averageRating: "5.0",
        },
        {
          name: "Amazon Rainforest",
          description: "The world's largest tropical rainforest, home to incredible biodiversity and indigenous communities.",
          city: "Manaus",
          state: "AM",
          country: "Brazil",
          lat: "-3.119028",
          lng: "-60.021731",
          address: "Floresta Amazônica",
          createdBy: userId,
          averageRating: "4.8",
        },
        {
          name: "Copacabana Beach",
          description: "Famous 4km beach in Rio de Janeiro known for its lively atmosphere, beach volleyball, and stunning views.",
          city: "Rio de Janeiro",
          state: "RJ",
          country: "Brazil",
          lat: "-22.971177",
          lng: "-43.182543",
          address: "Av. Atlântica - Copacabana",
          createdBy: userId,
          averageRating: "4.6",
        },
      ])
      .onConflictDoNothing()
      .returning();

    console.log(`✓ Created ${spots.length} tourist spots`);

    // Create sample lodgings
    if (spots.length > 0) {
      console.log("Creating lodgings...");
      await db
        .insert(lodgings)
        .values([
          {
            spotId: spots[0].id,
            name: "Belmond Copacabana Palace",
            address: "Av. Atlântica, 1702 - Copacabana",
            phone: "+55 21 2548-7070",
            avgPrice: "850.00",
            type: "Hotel",
            bookingLink: "https://www.belmond.com/hotels/south-america/brazil/rio-de-janeiro/belmond-copacabana-palace/",
          },
          {
            spotId: spots[1].id,
            name: "Yoo2 Rio de Janeiro",
            address: "Praia de Botafogo, 242 - Botafogo",
            phone: "+55 21 2131-1000",
            avgPrice: "320.00",
            type: "Hotel",
            bookingLink: "https://www.yoo2rio.com/",
          },
          {
            spotId: spots[2].id,
            name: "Belmond Hotel das Cataratas",
            address: "Rodovia BR-469, Km 32 - Parque Nacional do Iguaçu",
            phone: "+55 45 2102-7000",
            avgPrice: "950.00",
            type: "Hotel",
            bookingLink: "https://www.belmond.com/hotels/south-america/brazil/iguassu-falls/belmond-hotel-das-cataratas/",
          },
        ])
        .onConflictDoNothing();

      console.log("✓ Lodgings created");
    }

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nTest user credentials:");
    console.log("  Email: admin@tourism.com");
    console.log("  Login: admin");
    console.log("\nYou can now:");
    console.log("  - View spots: curl http://localhost:3000/spots");
    console.log("  - View frontend: http://localhost:5173");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

