const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const MAX_FIELD_LENGTH = 4000;
const ALLOWED_FIELDS = new Set(["Nombre o alias","País y zona horaria","Canal principal","Otras redes","Contenido habitual","Disponibilidad","Motivación","Ideas de colaboración","Empresa o marca","Persona de contacto","Correo de contacto","Juego o proyecto","Objetivo","Fechas","Plataformas y entregables","Presupuesto o modalidad","Tipo de propuesta","Fechas estimadas","Presupuesto orientativo","Descripción y objetivos","subject","website"]);
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
export async function onRequest({request,env}){
 if(request.method!=="POST")return json({error:"Método no permitido."},405);
 let payload;try{payload=await request.json();}catch{return json({error:"Solicitud JSON inválida."},400);}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return json({error:"Formulario inválido."},400);
 if(typeof payload.website==="string"&&payload.website.trim())return json({ok:true});
 const entries=Object.entries(payload).filter(([key])=>key!=="website");
 if(!entries.length||entries.some(([key,value])=>!ALLOWED_FIELDS.has(key)||typeof value!=="string"||value.length>MAX_FIELD_LENGTH))return json({error:"Hay campos inválidos o demasiado extensos."},400);
 const email=payload["Correo de contacto"];if(email&&!EMAIL_RE.test(email.trim()))return json({error:"El correo de contacto no es válido."},400);
 const subject=String(payload.subject||"Contacto · Legión Multiversal").trim().slice(0,140);
 const lines=entries.filter(([key])=>key!=="subject").map(([key,value])=>key+": "+value.trim());
 if(!lines.some(line=>line.split(":")[1]?.trim()))return json({error:"El formulario está vacío."},400);
 if(!env.RESEND_API_KEY||!env.RESEND_FROM)return json({error:"El servicio de correo todavía no está configurado."},503);
 const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.RESEND_FROM,to:[env.CONTACT_TO||"losmoriartys@gmail.com"],reply_to:email?email.trim():undefined,subject,text:lines.join("\\n\\n")})});
 if(!result.ok)return json({error:"No se pudo entregar el mensaje al proveedor de correo."},502);
 return json({ok:true});
}
