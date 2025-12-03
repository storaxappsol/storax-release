import { NextResponse, type NextRequest } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

const STORAGE_PROGRAM_ID =
  process.env.STORAGE_REGISTRY_PROGRAM_ID ??
  "storageregistry11111111111111111111111111111";
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

type StorageDto = {
  address: string;
  cid: string;
  arweaveTx: string;
  filecoinDeal: string;
  redundancy: number;
  shardCount: number;
  lastProofSlot: number;
  status: string;
};

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  if (!owner) {
    return NextResponse.json({ error: "owner param required" }, { status: 400 });
  }

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const programId = new PublicKey(STORAGE_PROGRAM_ID);
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          memcmp: {
            offset: 32,
            bytes: owner,
          },
        },
      ],
    });

    const decoded: StorageDto[] = accounts.map((acc) =>
      decodeStorageObject(acc.pubkey, acc.account.data),
    );

    return NextResponse.json({ objects: decoded });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

function decodeStorageObject(pk: PublicKey, data: Buffer): StorageDto {
  const cursor = { value: 0 };
  cursor.value += 32; // registry
  cursor.value += 32; // owner

  const cid = readBorshString(data, cursor);
  const arweaveTx = readBorshString(data, cursor);
  const filecoinDeal = readBorshString(data, cursor);

  const redundancy = data.readUInt16LE(cursor.value);
  cursor.value += 2;
  const shardCount = data.readUInt16LE(cursor.value);
  cursor.value += 2;
  const lastProofSlot = Number(data.readBigUInt64LE(cursor.value));
  cursor.value += 8;
  const statusIndex = data.readUInt8(cursor.value);
  cursor.value += 1;

  const statuses = ["Pending", "Verifying", "Verified", "SlashProposed"];

  return {
    address: pk.toBase58(),
    cid,
    arweaveTx,
    filecoinDeal,
    redundancy,
    shardCount,
    lastProofSlot,
    status: statuses[statusIndex] ?? "Pending",
  };
}

function readBorshString(data: Buffer, cursor: { value: number }) {
  const len = data.readUInt32LE(cursor.value);
  cursor.value += 4;
  const value = data.slice(cursor.value, cursor.value + len).toString("utf8");
  cursor.value += len;
  return value;
}


