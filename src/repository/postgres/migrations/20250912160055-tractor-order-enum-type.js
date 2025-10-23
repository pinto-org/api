'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add CONVERT_UP_V0 to the enum
    const typeName = 'enum_tractor_order_orderType';
    const newValue = 'CONVERT_UP_V0';

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = '${typeName}' AND e.enumlabel = '${newValue}'
        ) THEN
          ALTER TYPE "${typeName}" ADD VALUE '${newValue}';
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    const table = 'tractor_order';
    const column = 'orderType';
    const oldValues = ['SOW_V0']; // original values only (WITHOUT the new one)

    // 1) create a new type
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_${table}_${column}_old" AS ENUM (${oldValues.map((v) => `'${v}'`).join(', ')});`
    );

    // 2) change column to the new type (with cast)
    await queryInterface.sequelize.query(`
      ALTER TABLE "${table}"
      ALTER COLUMN "${column}" TYPE "enum_${table}_${column}_old"
      USING "${column}"::text::"enum_${table}_${column}_old";
    `);

    // 3) drop the current type & rename the old one back
    await queryInterface.sequelize.query(`DROP TYPE "enum_${table}_${column}";`);
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_${table}_${column}_old" RENAME TO "enum_${table}_${column}";`
    );
  }
};
