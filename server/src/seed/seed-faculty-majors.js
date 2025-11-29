import prisma from '../prisma.js';

/**
 * Seed data for Faculty (Khoa) and Majors (NganhHoc)
 */
export async function seedFacultyAndMajors() {
  console.log('🌱 Seeding Faculty and Majors...');

  // Create Faculty: Khoa Công nghệ thông tin
  const khoaCNTT = await prisma.khoa.upsert({
    where: { maKhoa: 'CNTT' },
    update: {},
    create: {
      maKhoa: 'CNTT',
      tenKhoa: 'Khoa Công nghệ thông tin',
      moTa: 'Khoa Công nghệ thông tin - Đào tạo các ngành liên quan đến công nghệ thông tin',
      isActive: true,
    },
  });

  console.log('✅ Created Faculty:', khoaCNTT.tenKhoa);

  // Create Majors under CNTT Faculty
  const majors = [
    {
      maNganh: '748201',
      tenNganh: 'Công nghệ thông tin',
      moTa: 'Ngành Công nghệ thông tin',
      khoaId: khoaCNTT.id,
    },
    {
      maNganh: '748202',
      tenNganh: 'An toàn thông tin',
      moTa: 'Ngành An toàn thông tin',
      khoaId: khoaCNTT.id,
    },
    {
      maNganh: '746108',
      tenNganh: 'Khoa học dữ liệu',
      moTa: 'Ngành Khoa học dữ liệu',
      khoaId: khoaCNTT.id,
    },
  ];

  for (const major of majors) {
    const nganhHoc = await prisma.nganhHoc.upsert({
      where: { maNganh: major.maNganh },
      update: {},
      create: major,
    });
    console.log('  ✅ Created Major:', nganhHoc.tenNganh);
  }

  console.log('✅ Faculty and Majors seeding completed!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFacultyAndMajors()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
