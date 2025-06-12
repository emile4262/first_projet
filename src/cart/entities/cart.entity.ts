import { CartStatus } from "@prisma/client";

export class Cart {
  products: any;
  total: number;
  status: CartStatus;
}
