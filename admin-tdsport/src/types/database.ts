export interface Confederacion {
    id: number;
    nombre: string;
    codigo: string;
}

export interface Pais {
    id: number;
    nombre: string;
    codigo_iso: string;
    confederacion_id: number;
    confederacion?: Confederacion;
}

export interface Catalogo {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface Torneo {
    id: string;
    nombre: string;
    pais_id: number;
    tipo_id: number;
    formato_id: number;
    temporada_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado_id: number;
    numero_equipos: number;

    pais?: {
        id: number;
        nombre: string;
        codigo_iso: string;
        confederacion?: Confederacion;
    };

    tipo?: Catalogo;
    formato?: Catalogo;
    temporada?: Catalogo;
    estado?: Catalogo;
    torneo_paises?: {
        pais_id: number;
        pais?: Pais;
    }[];
}
