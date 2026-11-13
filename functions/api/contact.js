const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 4000;
const MAX_BODY_LENGTH = 20000;
const ALLOWED_FIELDS = new Set(["Nombre o alias","País y zona horaria","Canal principal","Otras redes","Contenido habitual","Disponibilidad","Motivación","Ideas de colaboración","Empresa o marca","Persona de contacto","Correo de contacto","Juego o proyecto","Objetivo","Fechas","Plataformas y entregables","Presupuesto o modalidad","Tipo de propuesta","Fechas estimadas","Presupuesto orientativo","Descripción y objetivos","subject","website"]);
const REQUIRED_FIELDS = {
 "Solicitud de incorporación a Legión Multiversal": ["Nombre o alias","Canal principal","Motivación"],
 "Propuesta de colaboración para Legión Multiversal": ["Empresa o marca","Persona de contacto","Correo de contacto","Descripción y objetivos"]
};
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
export async function onRequest({request,env}){
 if(request.method!=="POST")return json({error:"Método no permitido."},405);
 let payload;
 try{
  const raw=await request.text();
  if(raw.length>MAX_BODY_LENGTH)return json({error:"La solicitud supera el tamaño permitido."},413);
  payload=JSON.parse(raw);
 }catch{return json({error:"Solicitud JSON inválida."},400);}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return json({error:"Formulario inválido."},400);
 if(typeof payload.website==="string"&&payload.website.trim())return json({ok:true});
 const entries=Object.entries(payload).filter(([key])=>key!=="website");
 if(!entries.length||entries.some(([key,value])=>!ALLOWED_FIELDS.has(key)||typeof value!=="string"||value.length>MAX_FIELD_LENGTH))return json({error:"Hay campos inválidos o demasiado extensos."},400);
 const subjectType=typeof payload.subject==="string"?payload.subject.trim():"";
 const requiredFields=REQUIRED_FIELDS[subjectType];
 if(!requiredFields)return json({error:"Tipo de formulario no reconocido."},400);
 const missing=requiredFields.filter(key=>typeof payload[key]!=="string"||!payload[key].trim());
 if(missing.length)return json({error:"Faltan campos obligatorios: "+missing.join(", ")+"."},400);
 const email=typeof payload["Correo de contacto"]==="string"?payload["Correo de contacto"].trim():"";
 if(email&&!EMAIL_RE.test(email))return json({error:"El correo de contacto no es válido."},400);
 if(subjectType==="Solicitud de incorporación a Legión Multiversal"){
  try{
   const channelUrl=new URL(payload["Canal principal"].trim());
   if(channelUrl.protocol!=="https:"&&channelUrl.protocol!=="http:")throw new Error("scheme");
  }catch{return json({error:"El enlace del canal principal no es válido."},400);}
 }
 const subject=subjectType;
 const lines=entries.filter(([key])=>key!=="subject").map(([key,value])=>key+": "+value.trim());
 if(!lines.some(line=>line.split(":").slice(1).join(":").trim()))return json({error:"El formulario está vacío."},400);
 if(!env.RESEND_API_KEY||!env.RESEND_FROM)return json({error:"El servicio de correo todavía no está configurado."},503);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 let result;
 try{
  result=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},
   body:JSON.stringify({
    from:env.RESEND_FROM,
    to:[env.CONTACT_TO||"losmoriartys@gmail.com"],
    reply_to:email||undefined,
    subject,
    text:lines.join("\n\n")
   }),
   signal:controller.signal
  });
 }catch{return json({error:"No se pudo conectar con el servicio de correo."},502);}
 finally{clearTimeout(timeout);}
 if(!result.ok)return json({error:"No se pudo entregar el mensaje al proveedor de correo."},502);
 return json({ok:true});
}
