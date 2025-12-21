import { db } from "./db";
import bcrypt from "bcryptjs";
import { type Insertable } from "kysely";
import { type Products, type Categories, type Locations, type Suppliers, type Users } from "./schema";

/**
 * A collection of utility functions to seed the database with sample data.
 * These functions are designed to be idempotent, meaning they can be run multiple
 * times without creating duplicate entries or causing errors.
 *
 * This is useful for setting up development, staging, or testing environments.
 *
 * Usage:
 * These functions can be called from a dedicated seeding endpoint or a script runner.
 * e.g., `await seedAllData();`
 */

const BCRYPT_SALT_ROUNDS = 10;

// --- Seed Data Definitions ---

const seedCategories: Array<Insertable<Categories>> = [
  { name: "Bebidas" },
  { name: "Snacks" },
  { name: "Lácteos y Huevos" },
  { name: "Panadería" },
  { name: "Cuidado Personal" },
  { name: "Limpieza del Hogar" },
];

const seedLocations: Array<Insertable<Locations>> = [
  { name: "Kiosko Principal", code: "KIOSK-01", locationType: "kiosk", address: "Lobby Torre 1" },
  { name: "Bodega Central", code: "BOD-01", locationType: "bodega", address: "Sótano -1" },
  { name: "Tienda Social", code: "SHOP-01", locationType: "tienda", address: "Salón Social" },
];

const seedSuppliers: Array<Insertable<Suppliers>> = [
  { name: "Distribuidora La Cesta", taxId: "900123456-1", idType: "NIT", paymentTermsType: "CONTADO", leadTimeDays: 2, email: "pedidos@lacesta.com", phone: "3101234567" },
  { name: "Provedores ABC", taxId: "900654321-1", idType: "NIT", paymentTermsType: "CREDITO", creditDays: 30, leadTimeDays: 5, email: "ventas@proveedoresabc.com", phone: "3119876543" },
];

const seedProducts: Array<Omit<Insertable<Products>, 'categoryId' | 'supplierId'>> = [
    { name: "Agua Cristal 600ml", barcode: "7702010001234", price: "2000", cost: "1200", stockQuantity: 100, minimumStock: 20, category: "Bebidas" },
    { name: "Coca-Cola 350ml", barcode: "7702010005678", price: "3000", cost: "1800", stockQuantity: 80, minimumStock: 15, category: "Bebidas" },
    { name: "Papas Margarita Pollo", barcode: "7702189001122", price: "2500", cost: "1500", stockQuantity: 120, minimumStock: 25, category: "Snacks" },
    { name: "Galletas Oreo x6", barcode: "7622201752409", price: "4000", cost: "2800", stockQuantity: 50, minimumStock: 10, category: "Snacks" },
    { name: "Leche Alquería 1L", barcode: "7702105000011", price: "4500", cost: "3500", stockQuantity: 40, minimumStock: 10, category: "Lácteos y Huevos" },
    { name: "Pan Tajado Bimbo", barcode: "7702030000123", price: "5000", cost: "3800", stockQuantity: 30, minimumStock: 10, category: "Panadería" },
    { name: "Jabón Dove", barcode: "8717163766201", price: "3500", cost: "2200", stockQuantity: 60, minimumStock: 15, category: "Cuidado Personal" },
];

// --- Seeding Functions ---

/**
 * Seeds the 'users' table with a default admin user.
 * Idempotent: Does nothing if a user with the email already exists.
 */
export async function seedAdminUser() {
  console.log("Seeding admin user...");
  try {
    const adminEmail = "admin@Alwon.com";
    const existingAdmin = await db
      .selectFrom("users")
      .where("email", "=", adminEmail)
      .select("id")
      .executeTakeFirst();

    if (existingAdmin) {
      console.log("Admin user already exists. Skipping.");
      return;
    }

    const passwordHash = await bcrypt.hash("admin123", BCRYPT_SALT_ROUNDS);

    await db
      .insertInto("users")
      .values({
        email: adminEmail,
        passwordHash,
        fullName: "Admin Alwon",
        displayName: "Admin",
        role: "admin",
        isActive: true,
        status: "active",
      })
      .execute();
    console.log("Admin user seeded successfully.");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

/**
 * Seeds the database with master data like categories, locations, and suppliers.
 * Idempotent: Uses 'ON CONFLICT DO NOTHING' to avoid duplicates.
 */
export async function seedMasterData() {
  console.log("Seeding master data (categories, locations, suppliers)...");
  try {
    // Seed Categories
    const catResult = await db
      .insertInto("categories")
      .values(seedCategories)
      .onConflict((oc) => oc.column("name").doNothing())
      .execute();
    console.log(`Categories seeded: ${catResult.length} new rows.`);

    // Seed Locations
    const locResult = await db
      .insertInto("locations")
      .values(seedLocations)
      .onConflict((oc) => oc.column("code").doNothing())
      .execute();
    console.log(`Locations seeded: ${locResult.length} new rows.`);

    // Seed Suppliers
    const supResult = await db
      .insertInto("suppliers")
      .values(seedSuppliers)
      .onConflict((oc) => oc.column("taxId").doNothing())
      .execute();
    console.log(`Suppliers seeded: ${supResult.length} new rows.`);

    console.log("Master data seeding complete.");
  } catch (error) {
    console.error("Error seeding master data:", error);
    throw error;
  }
}

/**
 * Seeds the 'products' table with sample products.
 * Idempotent: Uses barcode for conflict resolution.
 * Note: This depends on master data (categories, suppliers) being seeded first.
 */
export async function seedProductsData() {
  console.log("Seeding products...");
  try {
    // Fetch IDs of previously seeded master data
    const categories = await db.selectFrom("categories").selectAll().execute();
    const suppliers = await db.selectFrom("suppliers").selectAll().execute();

    if (categories.length === 0 || suppliers.length === 0) {
      console.error("Cannot seed products. Categories or suppliers are missing. Run seedMasterData first.");
      return;
    }

    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const firstSupplierId = suppliers[0].id;

    const productsToInsert: Array<Insertable<Products>> = seedProducts.map(p => ({
      ...p,
      categoryId: categoryMap.get(p.category as string),
      supplierId: firstSupplierId, // Assign all to the first supplier for simplicity
    }));

    const result = await db
      .insertInto("products")
      .values(productsToInsert)
      .onConflict((oc) => oc.column("barcode").doNothing())
      .execute();
    
    console.log(`Products seeded: ${result.length} new rows.`);
    console.log("Product data seeding complete.");
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
}

/**
 * Executes all seeding functions in the correct order.
 */
export async function seedAllData() {
  console.log("--- Starting Full Database Seed ---");
  try {
    await seedAdminUser();
    await seedMasterData();
    await seedProductsData();
    console.log("--- Full Database Seed Completed Successfully ---");
    return { success: true, message: "Database seeded successfully." };
  } catch (error) {
    console.error("--- Full Database Seed Failed ---", error);
    return { success: false, message: "Database seeding failed. Check logs for details." };
  }
}