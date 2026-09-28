const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
);

async function test() {
  const { data, error } = await supabase
    .from('torneos')
    .select(` id, nombre, pais_id, tipo_id, formato_id, temporada_id, fecha_inicio,
        fecha_fin, estado_id, numero_equipos, pais:paises ( id, nombre, codigo_iso,
            confederacion:confederaciones ( id, nombre, codigo )
        ),
        tipo:tipos_torneo ( id, nombre ),
        formato:formatos_torneo ( id, nombre ),
        temporada:temporadas ( id, nombre ),
        estado:estados_torneo ( id, nombre )
    `)
    .limit(1);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

test();
