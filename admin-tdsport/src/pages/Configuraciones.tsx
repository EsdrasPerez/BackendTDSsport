import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// MUI Icons
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import SportsScoreIcon from '@mui/icons-material/SportsScore';

interface Configuracion {
    id: number;
    nombre_plataforma: string;
    descripcion: string;
    puntos_marcador_exacto: number;
    puntos_resultado_correcto: number;
    max_participantes_default: number;
    permitir_quinielas_publicas: boolean;
    permitir_crear_quinielas: boolean;
}

const configuracionInicial: Configuracion = {
    id: 1,
    nombre_plataforma: 'TDSPORT',
    descripcion: 'Plataforma de quinielas deportivas',
    puntos_marcador_exacto: 3,
    puntos_resultado_correcto: 1,
    max_participantes_default: 20,
    permitir_quinielas_publicas: true,
    permitir_crear_quinielas: true,
};

export default function Configuraciones() {
    const [config, setConfig] = useState<Configuracion>(
        configuracionInicial
    );
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState<'success' | 'danger'>(
        'success'
    );

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    async function cargarConfiguracion() {
        setCargando(true);
        setMensaje('');

        try {
            const { data, error } = await supabase
                .from('configuraciones_app')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;

            setConfig(data as Configuracion);
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
            setTipoMensaje('danger');
            setMensaje(
                'No se pudo cargar la configuración. Verifica la conexión y que exista el registro inicial en Supabase.'
            );
        } finally {
            setCargando(false);
        }
    }

    function actualizar<K extends keyof Configuracion>(
        campo: K,
        valor: Configuracion[K]
    ) {
        setConfig((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    }

    async function guardarConfiguracion(
        evento: React.FormEvent<HTMLFormElement>
    ) {
        evento.preventDefault();
        setMensaje('');

        if (
            !config.nombre_plataforma.trim() ||
            !config.descripcion.trim()
        ) {
            setTipoMensaje('danger');
            setMensaje('Completa el nombre y la descripción.');
            return;
        }

        if (
            !Number.isInteger(config.puntos_marcador_exacto) ||
            !Number.isInteger(config.puntos_resultado_correcto) ||
            config.puntos_marcador_exacto < 0 ||
            config.puntos_resultado_correcto < 0
        ) {
            setTipoMensaje('danger');
            setMensaje('Los puntos deben ser números enteros no negativos.');
            return;
        }

        if (
            config.max_participantes_default < 1 ||
            !Number.isInteger(config.max_participantes_default)
        ) {
            setTipoMensaje('danger');
            setMensaje('El límite de participantes debe ser un entero mayor que cero.');
            return;
        }

        setGuardando(true);

        try {
            const { data: usuarioData, error: usuarioError } =
                await supabase.auth.getUser();

            if (usuarioError) throw usuarioError;

            if (!usuarioData.user) {
                throw new Error('Debes iniciar sesión para guardar cambios.');
            }

            const { data, error } = await supabase
                .from('configuraciones_app')
                .update({
                    nombre_plataforma: config.nombre_plataforma.trim(),
                    descripcion: config.descripcion.trim(),
                    puntos_marcador_exacto: config.puntos_marcador_exacto,
                    puntos_resultado_correcto: config.puntos_resultado_correcto,
                    max_participantes_default: config.max_participantes_default,
                    permitir_quinielas_publicas: config.permitir_quinielas_publicas,
                    permitir_crear_quinielas: config.permitir_crear_quinielas,
                    actualizado_en: new Date().toISOString(),
                    actualizado_por: usuarioData.user.id,
                })
                .eq('id', 1)
                .select()
                .single();

            if (error) throw error;

            setConfig(data as Configuracion);
            setTipoMensaje('success');
            setMensaje('¡Configuración guardada correctamente!');
        } catch (error) {
            console.error('Error al guardar:', error);
            setTipoMensaje('danger');
            setMensaje(
                error instanceof Error
                    ? error.message
                    : 'No fue posible guardar. Verifica tus permisos de administrador.'
            );
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-3 text-muted">Cargando configuraciones...</p>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid py-4 px-3 px-md-4">
                {/* HERO HEADER */}
                <div className="tds-calendar-hero mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{
                                    width: 52,
                                    height: 52,
                                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <SettingsIcon sx={{ fontSize: 32, color: 'var(--tds-lime, #7cff4f)' }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-white">Configuraciones Generales</h2>
                                <p className="text-white-50 mb-0">
                                    Administra los parámetros de la plataforma, reglas de puntuación y límites globales.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {mensaje && (
                    <div
                        className={`alert alert-${tipoMensaje} alert-dismissible d-flex align-items-center justify-content-between shadow-sm mb-4`}
                        role="alert"
                        style={{ borderRadius: '12px' }}
                    >
                        <div className="d-flex align-items-center gap-2">
                            {tipoMensaje === 'success' ? (
                                <CheckCircleIcon sx={{ fontSize: 22 }} />
                            ) : (
                                <CancelIcon sx={{ fontSize: 22 }} />
                            )}
                            <div>{mensaje}</div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 text-reset"
                            aria-label="Cerrar"
                            onClick={() => setMensaje('')}
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                )}

                <form onSubmit={guardarConfiguracion}>
                    <div className="row g-4">
                        <div className="col-12 col-xl-8">
                            {/* GENERAL */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-header bg-white py-3 px-4 border-bottom">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                        <TuneIcon sx={{ fontSize: 22, color: 'var(--tds-navy, #0f1e36)' }} />
                                        <span>Configuración General</span>
                                    </h5>
                                </div>

                                <div className="card-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Nombre de la plataforma
                                        </label>
                                        <input
                                            className="form-control"
                                            style={{ borderRadius: '10px' }}
                                            value={config.nombre_plataforma}
                                            onChange={(e) =>
                                                actualizar('nombre_plataforma', e.target.value)
                                            }
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div className="mb-0">
                                        <label className="form-label fw-semibold">
                                            Descripción
                                        </label>
                                        <textarea
                                            className="form-control"
                                            style={{ borderRadius: '10px' }}
                                            rows={3}
                                            value={config.descripcion}
                                            onChange={(e) =>
                                                actualizar('descripcion', e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* REGLAS DE PUNTUACION */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-header bg-white py-3 px-4 border-bottom">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                        <EmojiEventsIcon sx={{ fontSize: 22, color: 'var(--tds-navy, #0f1e36)' }} />
                                        <span>Reglas de Puntuación</span>
                                    </h5>
                                </div>

                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Marcador exacto
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-white text-muted">
                                                    <SportsScoreIcon sx={{ fontSize: 20 }} />
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="form-control"
                                                    value={config.puntos_marcador_exacto}
                                                    onChange={(e) =>
                                                        actualizar(
                                                            'puntos_marcador_exacto',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    required
                                                />
                                                <span className="input-group-text">puntos</span>
                                            </div>
                                            <small className="text-muted d-block mt-1">
                                                Ejemplo: pronosticar 2-1 y acertar el marcador 2-1.
                                            </small>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Resultado correcto
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-white text-muted">
                                                    <EmojiEventsIcon sx={{ fontSize: 20 }} />
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="form-control"
                                                    value={config.puntos_resultado_correcto}
                                                    onChange={(e) =>
                                                        actualizar(
                                                            'puntos_resultado_correcto',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    required
                                                />
                                                <span className="input-group-text">puntos</span>
                                            </div>
                                            <small className="text-muted d-block mt-1">
                                                Acertar ganador o empate sin acertar el marcador exacto.
                                            </small>
                                        </div>
                                    </div>

                                    <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2" style={{ borderRadius: '10px' }}>
                                        <SportsScoreIcon sx={{ fontSize: 20 }} />
                                        <span className="small">
                                            El marcador exacto tiene prioridad sobre el resultado correcto. Estas reglas se aplican al procesar las quinielas tras finalizar cada partido.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* QUINIELAS Y PARTICIPANTES */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-header bg-white py-3 px-4 border-bottom">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                        <GroupsIcon sx={{ fontSize: 22, color: 'var(--tds-navy, #0f1e36)' }} />
                                        <span>Quinielas y Participantes</span>
                                    </h5>
                                </div>

                                <div className="card-body p-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">
                                            Límite predeterminado de participantes
                                        </label>
                                        <div className="input-group" style={{ maxWidth: '320px' }}>
                                            <span className="input-group-text bg-white text-muted">
                                                <GroupsIcon sx={{ fontSize: 20 }} />
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                className="form-control"
                                                value={config.max_participantes_default}
                                                onChange={(e) =>
                                                    actualizar(
                                                        'max_participantes_default',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                required
                                            />
                                            <span className="input-group-text">usuarios</span>
                                        </div>
                                        <small className="text-muted d-block mt-1">
                                            Se aplicará al crear nuevas quinielas cuando no se especifique otro límite.
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex flex-wrap gap-2 justify-content-end mb-4">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2"
                                    style={{ borderRadius: '10px' }}
                                    onClick={cargarConfiguracion}
                                    disabled={guardando}
                                >
                                    <RestartAltIcon sx={{ fontSize: 18 }} />
                                    <span>Descartar cambios</span>
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                                    style={{ borderRadius: '10px', fontWeight: 600 }}
                                    disabled={guardando}
                                >
                                    {guardando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SaveIcon sx={{ fontSize: 20 }} />
                                            <span>Guardar configuración</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* RESUMEN ACTUAL (RIGHT COLUMN) */}
                        <div className="col-12 col-xl-4">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{
                                                width: 52,
                                                height: 52,
                                                backgroundColor: 'rgba(15, 30, 54, 0.08)',
                                            }}
                                        >
                                            <SettingsIcon sx={{ fontSize: 26, color: 'var(--tds-navy, #0f1e36)' }} />
                                        </div>
                                        <div>
                                            <h5 className="mb-0 fw-bold">Resumen Actual</h5>
                                            <small className="text-muted">
                                                Valores activos en pantalla
                                            </small>
                                        </div>
                                    </div>

                                    <hr className="my-3 opacity-25" />

                                    <div className="mb-3">
                                        <span className="text-muted small d-block mb-1">Puntuación por marcador exacto</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <SportsScoreIcon sx={{ fontSize: 22, color: 'var(--tds-navy, #0f1e36)' }} />
                                            <h4 className="fw-bold mb-0 text-dark">{config.puntos_marcador_exacto} <span className="fs-6 fw-normal text-muted">pts</span></h4>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <span className="text-muted small d-block mb-1">Resultado correcto</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <EmojiEventsIcon sx={{ fontSize: 22, color: '#ff9800' }} />
                                            <h4 className="fw-bold mb-0 text-dark">{config.puntos_resultado_correcto} <span className="fs-6 fw-normal text-muted">pts</span></h4>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <span className="text-muted small d-block mb-1">Límite de participantes por defecto</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <GroupsIcon sx={{ fontSize: 22, color: '#0d6efd' }} />
                                            <h4 className="fw-bold mb-0 text-dark">{config.max_participantes_default} <span className="fs-6 fw-normal text-muted">usuarios</span></h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

