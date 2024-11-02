import { PrismaClient, UserRole, TransactionType, BillStatus, NotificationStatus, PersonalInfoStatus, TransactionStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import hashService from '../security/hashService';

const prisma = new PrismaClient();

function generateSenegalesePhoneNumber() {
  const operatorPrefix = faker.helpers.arrayElement(['70', '76', '77', '78', '75']);
  const phoneNumber = `${operatorPrefix}${faker.number.int({ min: 1000000, max: 9999999 })}`;
  return `+221${phoneNumber}`;
}

async function main() {
  // Create a list to store created users for transaction pairing
  const users: any[] = [];

  // Create Users with Accounts, Bills, Notifications, etc.
  for (let i = 0; i < 10; i++) {
    // Créer l'utilisateur sans le qrCode d'abord
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await hashService.hash("0000"),
        phoneNumber: generateSenegalesePhoneNumber(),
        role: faker.helpers.arrayElement(Object.values(UserRole)),
        account: {
          create: {
            balance: faker.number.int({ min: 100, max: 5000 }),
            currency: 'FCFA',
            qrCode: "http://www.odc.wave.com"
          },
        },
        personalInfo: {
          create: {
            documentType: 'ID Card',
            verificationStatus: faker.helpers.arrayElement(Object.values(PersonalInfoStatus)),
          },
        },
        notifications: {
          createMany: {
            data: Array.from({ length: 3 }).map(() => ({
              message: faker.lorem.sentence(),
              isRead: faker.helpers.arrayElement(Object.values(NotificationStatus)),
            })),
          },
        },
        contacts: {
          createMany: {
            data: Array.from({ length: 2 }).map(() => ({
              name: faker.person.fullName(),
              phoneNumber: generateSenegalesePhoneNumber(),
              email: faker.internet.email(),
            })),
          },
        },
      },
    });

    // Créer l'URL du QR code avec l'ID de l'utilisateur
    const qrCodeUrl = `http://www.odc.wave.com/${user.id}`;

    // Mettre à jour l'utilisateur avec le qrCode
    await prisma.user.update({
      where: { id: user.id },
      data: {
        account: {
          update: {
            qrCode: qrCodeUrl,
          },
        },
      },
    });


    users.push(user);

    if (user.role !== UserRole.ADMIN) {
      // Create Bills
      await prisma.bill.createMany({
        data: Array.from({ length: 2 }).map(() => ({
          userId: user.id,
          amount: faker.number.int({ min: 50, max: 500 }),
          currency: 'FCFA',
          type: faker.commerce.product(),
          dueDate: faker.date.soon(),
          status: faker.helpers.arrayElement(Object.values(BillStatus)),
        })),
      });
    }
  }

  // Create Transactions where sender and receiver are different users
  for (const user of users) {
    if (user.role !== UserRole.ADMIN) {
      await prisma.transaction.createMany({
        data: Array.from({ length: 3 }).map(() => {
          let receiver = user;
          while (receiver.id === user.id) {
            receiver = users[faker.number.int({ min: 0, max: users.length - 1 })];
          }

          return {
            amount: faker.number.int({ min: 100, max: 2000 }),
            senderId: user.id,
            receiverId: receiver.id,
            feeAmount: faker.number.float({ min: 0, max: 10 }),
            currency: 'FCFA',
            transactionType: faker.helpers.arrayElement(Object.values(TransactionType)),
            status: faker.helpers.arrayElement(Object.values(TransactionStatus)),
          };
        }),
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
