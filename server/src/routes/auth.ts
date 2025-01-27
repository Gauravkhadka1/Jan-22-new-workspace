import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient';

const router = Router();

interface SignUpRequestBody {
  email: string;
  password: string;
  name: string; 
}

router.post(
  '/signup',
  async (req: Request<{}, {}, SignUpRequestBody>, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({ message: 'Email already in use.' });
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name, 
        },
      });

      res.status(201).json({
        message: 'User created successfully!',
        user: { id: newUser.id, email: newUser.email },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

export default router;
