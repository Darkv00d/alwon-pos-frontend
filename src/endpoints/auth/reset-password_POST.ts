import { db } from "../../helpers/db";
import superjson from "superjson";
import { z } from "zod";
import bcrypt from "bcryptjs";

const S = z.object({ token: z.string().uuid(), newPassword: z.string().min(8) });

export async function handle(req: Request){
  try{
    const { token, newPassword } = S.parse(await req.json());
    const row = await db.selectFrom("passwordResetTokens").selectAll().where("token","=",token).executeTakeFirst();
    if (!row || row.usedAt || new Date(row.expiresAt) < new Date()){
      return new Response(superjson.stringify({ ok:false, error:"Token inválido o expirado" }),{ status:400 });
    }
    const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 10));
    await db.transaction().execute(async (trx)=>{
      await trx.updateTable("users").set({ passwordHash: hash }).where("uuid","=",row.userUuid).execute();
      await trx.updateTable("passwordResetTokens").set({ usedAt: new Date() }).where("token","=",token).execute();
    });
    return new Response(superjson.stringify({ ok:true }));
  }catch(e:any){
    return new Response(superjson.stringify({ ok:false, error:e?.message }),{status:400});
  }
}