import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const Audios = () => {
    const [cursos, setCursos] = useState([]);
    const [audios, setAudios] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedCursoId, setSelectedCursoId] = useState(null);
    const [selectedCursoNome, setSelectedCursoNome] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCursos, setLoadingCursos] = useState(false);
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cursoParaExcluir, setCursoParaExcluir] = useState(null);

    const tipoUser = localStorage.getItem("userType");

    const editarCurso = (idCurso) => {
        navigate(`/cadastro-audio/${idCurso}`);
    };

    useEffect(() => {
        fetchCursos();
    }, []);

    const fetchCursos = async () => {
        setLoadingCursos(true);
        try {
            const response = await fetch(`${API_BASE_URL}/cursos`);
            const data = await response.json();
            const cursosOrdenados = data.sort((a, b) => 
                a.cp_nome_curso.localeCompare(b.cp_nome_curso, undefined, { 
                    numeric: true, 
                    sensitivity: 'base' 
                })
            );
            setCursos(cursosOrdenados);
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            toast.error("Erro ao carregar cursos");
        } finally {
            setLoadingCursos(false);
        }
    };

    const fetchAudios = async (cursoId, nomeDoCouso) => {
        setLoading(true);
        setPaginaAtual(1);
        try {
            console.log("Buscando áudios para curso:", cursoId);
            const response = await fetch(`${API_BASE_URL}/audios-curso/${cursoId}`);
            const data = await response.json();
            console.log("Áudios do curso carregados:", data);
            data.sort((a, b) => a.cp_nome_audio.localeCompare(b.cp_nome_audio, undefined, { 
                numeric: true, 
                sensitivity: 'base' 
            }));
            setAudios(data);
            setSelectedCursoId(cursoId);
            setSelectedCursoNome(nomeDoCouso);
        } catch (error) {
            console.error("Erro ao buscar áudios:", error);
            toast.error("Erro ao carregar áudios do curso");
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = () => {
        const newDirection = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(newDirection);
        const sortedCursos = [...cursos].sort((a, b) => {
            const nomeA = a.cp_nome_curso.toLowerCase();
            const nomeB = b.cp_nome_curso.toLowerCase();
            return newDirection === "asc"
                ? nomeA.localeCompare(nomeB)
                : nomeB.localeCompare(nomeA);
        });
        setCursos(sortedCursos);
    };

    const filteredCursos = cursos.filter((curso) =>
        curso.cp_nome_curso.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAudios = audios.slice(
        (paginaAtual - 1) * 10,
        paginaAtual * 10
    );

    const totalPaginasAudiosCurso = Math.ceil(audios.length / 10);

    const deletarCurso = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cursos/${cursoParaExcluir}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                toast.success("Curso excluído com sucesso!");
                fetchCursos();
                if (selectedCursoId === cursoParaExcluir) {
                    setSelectedCursoId(null);
                    setSelectedCursoNome("");
                    setAudios([]);
                }
            } else {
                toast.error("Erro ao excluir curso");
            }
        } catch (error) {
            console.error("Erro ao deletar curso:", error);
            toast.error("Erro ao excluir curso");
        } finally {
            setShowDeleteModal(false);
            setCursoParaExcluir(null);
        }
    };

    const confirmarExclusao = (cursoId) => {
        setCursoParaExcluir(cursoId);
        setShowDeleteModal(true);
    };

    return (
        <>
            <div className="row gy-4">
                {/* Coluna da Esquerda - Lista de Cursos */}
                <div className="col-xxl-4 col-lg-5">
                    <div className="card h-100 p-0">
                        <div className="card-header border-bottom bg-base py-16 px-24">
                            <h6 className="text-lg fw-semibold mb-0">Lista de Cursos</h6>
                        </div>
                        <div className="card-body p-24">
                            <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between mb-20">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-md fw-medium text-secondary-light">Pesquisar:</span>
                                    <div className="navbar-search">
                                        <input
                                            type="text"
                                            className="bg-base h-40-px w-auto"
                                            name="search"
                                            placeholder="Pesquisar curso..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Icon icon="ion:search-outline" className="icon" />
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={handleSortChange}
                                    >
                                        <Icon
                                            icon={
                                                sortDirection === "asc"
                                                    ? "iconamoon:arrow-up-2"
                                                    : "iconamoon:arrow-down-2"
                                            }
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-400-px overflow-y-auto">
                                {loadingCursos ? (
                                    <div className="text-center py-4">
                                        <span>Carregando cursos...</span>
                                    </div>
                                ) : filteredCursos.length === 0 ? (
                                    <div className="text-center py-4">
                                        <span>Nenhum curso encontrado</span>
                                    </div>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {filteredCursos.map((curso, index) => (
                                            <li
                                                key={curso.cp_curso_id}
                                                style={{
                                                    borderBottom: index === filteredCursos.length - 1 ? "none" : "1px solid #ddd",
                                                    padding: "8px 0",
                                                }}
                                            >
                                                <div
                                                    className={`p-2 d-flex justify-content-between align-items-center cursor-pointer ${
                                                        selectedCursoId === curso.cp_curso_id ? "bg-primary-50 border-primary rounded" : ""
                                                    }`}
                                                    onClick={() => fetchAudios(curso.cp_curso_id, curso.cp_nome_curso)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <span className={`fw-medium ${selectedCursoId === curso.cp_curso_id ? "text-primary" : ""}`}>
                                                        {curso.cp_nome_curso}
                                                    </span>
                                                    {tipoUser === "1" && (
                                                        <div className="d-inline-flex align-items-center gap-1">
                                                            <Link
                                                                to={`/cadastro-audio/${curso.cp_curso_id}`}
                                                                className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Icon icon="lucide:edit" />
                                                            </Link>
                                                            <button
                                                                className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    confirmarExclusao(curso.cp_curso_id);
                                                                }}
                                                            >
                                                                <Icon icon="mingcute:delete-2-line" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita - Lista de Áudios */}
                <div className="col-xxl-8 col-lg-7">
                    <div className="card h-100 p-0">
                        <div className="card-header border-bottom bg-base py-16 px-24">
                            <h6 className="text-lg fw-semibold mb-0">
                                {selectedCursoId ? `Áudios do Curso: ${selectedCursoNome}` : "Selecione um curso para ver os áudios"}
                            </h6>
                        </div>
                        <div className="card-body p-24">
                            {!selectedCursoId ? (
                                <div className="text-center py-5">
                                    <Icon icon="ph:music-note" className="text-6xl text-secondary-light mb-3" />
                                    <p className="text-secondary-light">
                                        Clique em um curso na lista à esquerda para visualizar seus áudios
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive scroll-sm">
                                        <table className="table bordered-table sm-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th style={{ minWidth: '200px' }}>Nome do Áudio</th>
                                                    <th className="text-center" style={{ minWidth: '300px' }}>Player</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="2" className="text-center">
                                                            Carregando áudios...
                                                        </td>
                                                    </tr>
                                                ) : filteredAudios.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="2" className="text-center">
                                                            Nenhum áudio encontrado para este curso
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredAudios.map((audio) => (
                                                        <tr key={audio.cp_audio_id}>
                                                            <td style={{ wordWrap: 'break-word' }}>
                                                                <div className="fw-semibold">
                                                                    {audio.cp_nome_audio}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <audio 
                                                                    controls 
                                                                    preload="none" 
                                                                    style={{ width: '100%', maxWidth: '300px' }}
                                                                >
                                                                    <source src={audio.url_audio} type="audio/mpeg" />
                                                                    Seu navegador não suporta o elemento <code>audio</code>.
                                                                </audio>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Paginação dos Áudios */}
                                    {audios.length > 10 && (
                                        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between mt-24 gap-3">
                                            <span className="mb-3 mb-md-0">
                                                Mostrando {paginaAtual} de {totalPaginasAudiosCurso} páginas
                                            </span>
                                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center mb-3 mb-md-0">
                                                <li className="page-item">
                                                    <button
                                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                                        onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                                                        disabled={paginaAtual === 1}
                                                    >
                                                        <Icon icon="ep:d-arrow-left" />
                                                    </button>
                                                </li>
                                                {[...Array(totalPaginasAudiosCurso)].map((_, index) => (
                                                    <li key={index} className="page-item">
                                                        <button
                                                            className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                                                                paginaAtual === index + 1
                                                                    ? "bg-primary-600 text-white"
                                                                    : "bg-neutral-200 text-secondary-light"
                                                            }`}
                                                            onClick={() => setPaginaAtual(index + 1)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    </li>
                                                ))}
                                                <li className="page-item">
                                                    <button
                                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                                        onClick={() => setPaginaAtual(Math.min(totalPaginasAudiosCurso, paginaAtual + 1))}
                                                        disabled={paginaAtual === totalPaginasAudiosCurso}
                                                    >
                                                        <Icon icon="ep:d-arrow-right" />
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Exclusão</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} />
                            </div>
                            <div className="modal-body">
                                Tem certeza que deseja excluir este curso? Essa ação não poderá ser desfeita.
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={deletarCurso}>Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </>
    );
};

export default Audios;