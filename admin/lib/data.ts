// Mock admin data for the test build. Every decision here must be written to the audit log by the real backend.

export type Seller = {
  id: string;
  name: string;
  area: string;
  kyc: "Pending" | "Approved" | "Sent back" | "Rejected";
  flag?: string;
  status: "Active" | "Suspended";
  products: number;
  heldPayout: number;
};

export type Payout = {
  id: string;
  seller: string;
  amount: number;
  method: string;
  check: string;
  state: "Waiting" | "Held" | "Blocked";
};

export const sellers: Seller[] = [
  { id: "s1", name: "Mirpur Mobile Hub", area: "Mirpur, Dhaka", kyc: "Pending", flag: "Over SLA", status: "Active", products: 12, heldPayout: 6500 },
  { id: "s2", name: "Sylhet Organics", area: "Sylhet", kyc: "Pending", flag: "TIN missing (optional)", status: "Active", products: 6, heldPayout: 0 },
  { id: "s3", name: "Nakshi Store", area: "Dhanmondi, Dhaka", kyc: "Approved", status: "Active", products: 42, heldPayout: 0 },
  { id: "s4", name: "Cheap Gadget BD", area: "Chattogram", kyc: "Approved", flag: "3 buyer complaints", status: "Suspended", products: 30, heldPayout: 0 },
];

export const payouts: Payout[] = [
  { id: "PO-1", seller: "Nakshi Store", amount: 84300, method: "bKash ••••4471", check: "Name matches", state: "Waiting" },
  { id: "PO-2", seller: "Sylhet Organics", amount: 12000, method: "Bank ••••2290", check: "Bank verification pending", state: "Blocked" },
  { id: "PO-3", seller: "Mirpur Mobile Hub", amount: 6500, method: "bKash ••••0093", check: "Dispute open", state: "Held" },
];

export const auditLog = [
  { time: "10 Oct 22:41", who: "Admin: Rahim", action: "Approved seller KYC", target: "Nakshi Store", reason: "NID and trade licence verified" },
  { time: "10 Oct 21:05", who: "Admin: Rahim", action: "Suspended seller", target: "Cheap Gadget BD", reason: "3 buyer complaints, under review" },
  { time: "10 Oct 18:30", who: "Admin: Karim", action: "Changed commission", target: "Fashion category", reason: "Campaign: 8% to 7%, approved by 2nd admin" },
  { time: "9 Oct 16:12", who: "Admin: Karim", action: "Held payout", target: "Mirpur Mobile Hub", reason: "Open dispute BZ-260409-0907" },
];

export const rules = {
  commission: 8,
  maxSellerCouponPercent: 30,
  returnWindowDays: 7,
  codLimit: 25000,
  secondApprovalAbove: 50000,
  kycSlaWorkingDays: 2,
};

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
