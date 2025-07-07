import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { API_BASE_URL } from "./config";
import { useNavigate, Link } from "react-router-dom";
import "./audio.css"
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Audios = () => {
    const [cursos, setCursos] = useState([]);
    const [audios, setAudios] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemsPerPageCursos, setItemsPerPageCursos] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedCursoId, setSelectedCursoId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paginaAtualCursos, setPaginaAtualCursos] = useState(1);
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

    const deletarCurso = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/delete-curso/${cursoParaExcluir}`);
            toast.success("Curso excluído com sucesso");
            setShowDeleteModal(false);
            setSelectedCursoId(null);
            setAudios([]);
            fetchCursos();
        } catch (error) {
            console.error("Erro ao excluir curso:", error);
            toast.error("Erro ao excluir curso");
        }
    };



    const fetchCursos = async () => {
        const professorId = localStorage.getItem('userId');
        const tipoUsuario = localStorage.getItem('userType');

        if (tipoUsuario === "1") {
            try {
                const response = await fetch(`${API_BASE_URL}/cursos`);
                const todosCursos = await response.json();

                const cursosComAudio = await Promise.all(
                    todosCursos.map(async (curso) => {
                        const response = await fetch(`${API_BASE_URL}/audios-curso/${curso.cp_curso_id}`);
                        const audios = await response.json();
                        return audios.length > 0 ? curso : null;
                    })
                );

                const cursosFiltrados = cursosComAudio.filter(curso => curso !== null);
                cursosFiltrados.sort((a, b) => a.cp_nome_curso.localeCompare(b.cp_nome_curso, undefined, { numeric: true, sensitivity: 'base' }));
                setCursos(cursosFiltrados);

            } catch (error) {
                console.error("Erro ao buscar todos os cursos:", error);
            }
            return;
        }

        try {
            const responseTurmas = await fetch(`${API_BASE_URL}/cp_turmas/professor/${professorId}`);
            const turmas = await responseTurmas.json();
            const cursoIds = turmas.map(turma => turma.cp_tr_curso_id);

            if (cursoIds.length > 0) {
                const responseCursos = await fetch(`${API_BASE_URL}/cursos/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cursoIds })
                });
                const cursos = await responseCursos.json();

                const cursosComAudio = await Promise.all(
                    cursos.map(async (curso) => {
                        const response = await fetch(`${API_BASE_URL}/audios-curso/${curso.cp_curso_id}`);
                        const audios = await response.json();
                        return audios.length > 0 ? curso : null;
                    })
                );

                const cursosFiltrados = cursosComAudio.filter(curso => curso !== null);
                cursosFiltrados.sort((a, b) => a.cp_nome_curso.localeCompare(b.cp_nome_curso, undefined, { numeric: true, sensitivity: 'base' }));
                setCursos(cursosFiltrados);

            } else {
                setCursos([]);
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
        }
    };




    const fetchAudios = async (cursoId) => {
        setLoading(true);
        setPaginaAtual(1); // Sempre volta para a primeira página ao trocar de curso
        try {
            const response = await fetch(`${API_BASE_URL}/audios-curso/${cursoId}`);
            const data = await response.json();
            data.sort((a, b) => a.cp_nome_audio.localeCompare(b.cp_nome_audio, undefined, { numeric: true, sensitivity: 'base' }));
            setAudios(data);
            setSelectedCursoId(cursoId);
        } catch (error) {
            console.error("Erro ao buscar áudios:", error);
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

    const filteredAudios = audios.slice(
        (paginaAtual - 1) * 10, // Mantém fixo em 10 itens por página
        paginaAtual * 10
    );

    const totalPaginasAudiosCurso = Math.ceil(audios.length / 10); // Também fixo em 10


    const filteredCursos = cursos.filter((curso) =>
        curso.cp_nome_curso.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const currentCursos =
        itemsPerPageCursos === "all"
            ? filteredCursos
            : filteredCursos.slice(
                (paginaAtualCursos - 1) * itemsPerPageCursos,
                paginaAtualCursos * itemsPerPageCursos
            );

    const totalPaginasCursos =
        itemsPerPageCursos === "all"
            ? 1
            : Math.ceil(filteredCursos.length / itemsPerPageCursos);


    const totalPaginas = itemsPerPage === "all" ? 1 : Math.ceil(filteredCursos.length / itemsPerPage);


    return (
        <div className="card h-100 p-0 radius-12">
            <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <span className="text-md fw-medium text-secondary-light mb-0">Mostrar</span>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={itemsPerPageCursos}
                        onChange={(e) => {
                            const value = e.target.value === "all" ? "all" : Number(e.target.value);
                            setItemsPerPageCursos(value);
                            setPaginaAtualCursos(1); // Reinicia para a primeira página de cursos
                        }}
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="all">Ver Todos</option>
                    </select>


                    <form className="navbar-search">
                        <input
                            type="text"
                            className="bg-base h-40-px w-auto"
                            placeholder="Pesquisar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon icon="ion:search-outline" className="icon" />
                    </form>
                    <button
                        className="btn btn-outline-secondary text-md py-6 radius-12 h-40-px d-flex align-items-center gap-2"
                        onClick={handleSortChange}
                    >
                        Ordenar por {sortDirection === "asc" ? "A-Z" : "Z-A"}
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-12 col-md-4 border-md-end mb-3 mb-md-0">
                    <div className="card-body p-24">
                        <ul className="align-items-center justify-content-center" sty>
                            {currentCursos.map((curso, index) => (
                                <div
                                    key={curso.cp_curso_id}
                                    style={{
                                        borderBottom: index === currentCursos.length - 1 ? "none" : "1px solid #ddd",
                                        padding: "3px",
                                    }}
                                >
                                    <li
                                        className={`p-2 d-flex justify-content-between align-items-center ${selectedCursoId === curso.cp_curso_id ? "active" : ""
                                            }`}
                                    >
                                        <span>
                                            {tipoUser === "1" && (
                                                <div className="d-inline-flex align-items-center gap-1">
                                                    <Link
                                                        style={{ marginRight: "4px" }}
                                                        to={`/cadastro-audio/${curso.cp_curso_id}`}
                                                        className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                    >
                                                        <Icon icon="lucide:edit" />
                                                    </Link>
                                                    {/* <button
                                                        style={{ marginRight: "4px" }}
                                                        className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0"
                                                        onClick={() => {
                                                            setCursoParaExcluir(curso.cp_curso_id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        <Icon icon="lucide:trash" />
                                                    </button> */}
                                                </div>
                                            )}
                                            {curso.cp_nome_curso}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => fetchAudios(curso.cp_curso_id)}
                                        >
                                            Ver Áudios
                                        </button>
                                    </li>
                                </div>
                            ))}
                            <div className="d-flex flex-column align-items-center justify-content-center mt-24">
                                <div className="d-flex align-items-center justify-content-between w-100 mb-3">
                                    <span>
                                        Mostrando {paginaAtualCursos} de {totalPaginasCursos} páginas
                                    </span>
                                    <select
                                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                        value={paginaAtualCursos}
                                        onChange={(e) => setPaginaAtualCursos(Number(e.target.value))}
                                    >
                                        {Array.from({ length: totalPaginasCursos }, (_, idx) => (
                                            <option key={idx + 1} value={idx + 1}>
                                                Página {idx + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                            onClick={() => setPaginaAtualCursos(1)}
                                            disabled={paginaAtualCursos === 1}
                                        >
                                            <Icon icon="ep:d-arrow-left" />
                                        </button>
                                    </li>
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                            onClick={() => setPaginaAtualCursos(prev => Math.max(prev - 1, 1))}
                                            disabled={paginaAtualCursos === 1}
                                        >
                                            Anterior
                                        </button>
                                    </li>
                                    {Array.from({ length: totalPaginasCursos }, (_, idx) => idx + 1)
                                        .filter(page => page === 1 || page === totalPaginasCursos || (page >= paginaAtualCursos - 2 && page <= paginaAtualCursos + 2))
                                        .map((page, idx, pages) => {
                                            if (idx > 0 && page > pages[idx - 1] + 1) {
                                                return (
                                                    <li key={`ellipsis-${idx}`} className="page-item">
                                                        <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                                            ...
                                                        </span>
                                                    </li>
                                                );
                                            }
                                            return (
                                                <li key={page} className={`page-item ${paginaAtualCursos === page ? "active" : ""}`}>
                                                    <button
                                                        className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${paginaAtualCursos === page ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"}`}
                                                        onClick={() => setPaginaAtualCursos(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                            onClick={() => setPaginaAtualCursos(prev => Math.min(prev + 1, totalPaginasCursos))}
                                            disabled={paginaAtualCursos === totalPaginasCursos}
                                        >
                                            Próximo
                                        </button>
                                    </li>
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                            onClick={() => setPaginaAtualCursos(totalPaginasCursos)}
                                            disabled={paginaAtualCursos === totalPaginasCursos}
                                        >
                                            <Icon icon="ep:d-arrow-right" />
                                        </button>
                                    </li>
                                </ul>
                            </div>

                        </ul>

                    </div>
                </div>
                <div className="col-12 col-md-8">
                    <div className="card-body p-24">
                        {(!selectedCursoId || audios.length === 0) && !loading ? (
                            <div className="fw-bold text-primary">Clique em "Ver Áudios"</div>
                        ) : (
                            <div className="table-responsive scroll-sm">

                                <table className="table bordered-table sm-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nome do Áudio</th>
                                            <th className="text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="2" className="text-center">
                                                    Carregando...
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAudios.map((audio) => (
                                                <tr key={audio.cp_audio_id}>
                                                    <td style={{ maxWidth: '260px', wordWrap: 'break-word' }}>
                                                        {audio.cp_nome_audio}
                                                    </td>
                                                    <td className="text-center">
                                                        {/* <audio controls controlsList="nodownload">
                                                            <source
                                                                src={`${API_BASE_URL}/audios/${audio.cp_nome_audio}`}
                                                                type="audio/mpeg"
                                                            />
                                                            Seu navegador não suporta o elemento <code>audio</code>.
                                                        </audio> */}
                                                        <audio controls preload="none" controlsList="nodownload">
                                                            <source src={`${API_BASE_URL}/audio/${audio.cp_nome_audio}`} type="audio/mpeg" />
                                                            Seu navegador não suporta o elemento <code>audio</code>.
                                                        </audio>

                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mt-24">
                            <span className="mb-3 mb-md-0">
                                Mostrando {paginaAtual} de {totalPaginasAudiosCurso} páginas
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center mb-3 mb-md-0">
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setPaginaAtual(1)}
                                        disabled={paginaAtual === 1}
                                    >
                                        <Icon icon="ep:d-arrow-left" />
                                    </button>
                                </li>
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                                        disabled={paginaAtual === 1}
                                    >
                                        Anterior
                                    </button>
                                </li>
                                {Array.from({ length: totalPaginasAudiosCurso }, (_, idx) => idx + 1)
                                    .filter((page) => {
                                        return (
                                            page === 1 ||
                                            page === totalPaginasAudiosCurso ||
                                            (page >= paginaAtual - 2 && page <= paginaAtual + 2)
                                        );
                                    })
                                    .map((page, idx, pages) => {
                                        if (idx > 0 && page > pages[idx - 1] + 1) {
                                            return (
                                                <li key={`ellipsis-${idx}`} className="page-item">
                                                    <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                                        ...
                                                    </span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li
                                                key={page}
                                                className={`page-item ${paginaAtual === page ? "active" : ""}`}
                                            >
                                                <button
                                                    className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${paginaAtual === page
                                                        ? "bg-primary-600 text-white"
                                                        : "bg-neutral-200 text-secondary-light"
                                                        }`}
                                                    onClick={() => setPaginaAtual(page)}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        );
                                    })}
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginasAudiosCurso))}
                                        disabled={paginaAtual === totalPaginasAudiosCurso}
                                    >
                                        Próximo
                                    </button>
                                </li>
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setPaginaAtual(totalPaginasAudiosCurso)}
                                        disabled={paginaAtual === totalPaginasAudiosCurso}
                                    >
                                        <Icon icon="ep:d-arrow-right" />
                                    </button>
                                </li>
                            </ul>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={paginaAtual}
                                onChange={(e) => setPaginaAtual(Number(e.target.value))}
                            >
                                {Array.from({ length: totalPaginasAudiosCurso }, (_, idx) => (
                                    <option key={idx + 1} value={idx + 1}>
                                        Página {idx + 1}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>
            </div>
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
        </div>
    );
};

export default Audios;
