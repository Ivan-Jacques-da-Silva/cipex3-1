import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
// import CadastroMatriculaModal from "./CadastroMatriculaModalTeste";
import { API_BASE_URL } from "./config";

const Usuarios = () => {
    const [matriculas, setMatriculas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [matriculaDataToEdit, setMatriculaDataToEdit] = useState(null);
    const [usuarios, setUsuarios] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [matriculasPerPage, setMatriculasPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchMatriculas();
    }, []);

    const fetchMatriculas = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/matriculas`);
            const data = await response.json();
            setMatriculas(data);

            const uniqueUserIds = [
                ...new Set(data.map((matricula) => matricula.cp_mt_usuario)),
            ];
            const usersData = {};
            for (const userId of uniqueUserIds) {
                const responseUsuario = await fetch(
                    `${API_BASE_URL}/matricula/${userId}`
                );
                const usuarioData = await responseUsuario.json();
                usersData[userId] = usuarioData.nomeUsuario;
            }
            setUsuarios(usersData);
        } catch (error) {
            console.error("Erro ao buscar matrículas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (matriculaId) => {
        try {
            await fetch(`${API_BASE_URL}/excluir-matricula/${matriculaId}`, {
                method: "DELETE",
            });
            fetchMatriculas();
        } catch (error) {
            console.error("Erro ao excluir matrícula:", error);
        }
    };

    const openEditModal = (matriculaId) => {
        const matricula = matriculas.find((m) => m.cp_mt_id === matriculaId);
        setMatriculaDataToEdit(matricula);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        fetchMatriculas();
    };

    const filteredMatriculas = matriculas.filter((matricula) => {
        const nomeUsuario = usuarios[matricula.cp_mt_usuario]?.toLowerCase() || "";

        const statusMatches = !statusFilter || matricula.cp_status_matricula?.toLowerCase() === statusFilter.toLowerCase();

        return nomeUsuario.includes(searchTerm.toLowerCase()) && statusMatches;
    });

    const totalPaginas = Math.ceil(filteredMatriculas.length / matriculasPerPage);

    const paginasVisiveis = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPaginas, currentPage + 2); i++) {
        paginasVisiveis.push(i);
    }

    const currentMatriculas = filteredMatriculas.slice(
        (currentPage - 1) * matriculasPerPage,
        currentPage * matriculasPerPage
    );

    return (
        <div className="card h-100 p-0 radius-12">
            <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <span className="text-md fw-medium text-secondary-light mb-0">
                        Mostrar
                    </span>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        defaultValue={matriculasPerPage}
                        onChange={(e) => {
                            setMatriculasPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                    <form className="navbar-search">
                        <input
                            type="text"
                            className="bg-base h-40-px w-auto"
                            name="search"
                            placeholder="Pesquisar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon icon="ion:search-outline" className="icon" />
                    </form>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos os Status</option>
                        <option value="ativo">Ativo</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="trancado">Trancado</option>
                        <option value="concluido">Concluído</option>
                    </select>
                </div>
                <Link
                    to="/cadastro-matricula"
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                >
                    <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                    Adicionar Novo
                </Link>
            </div>
            <div className="card-body p-24">
                <div className="table-responsive scroll-sm">
                    <table className="table bordered-table sm-table mb-0">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Status</th>
                                <th>Parcelas</th>
                                <th className="text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : (
                                currentMatriculas.map((matricula) => (
                                    <tr key={matricula.cp_mt_id}>
                                        <td>{usuarios[matricula.cp_mt_usuario]}</td>
                                        <td className="text-left">
                                            <span
                                                className={`badge ${matricula.cp_status_matricula === "ativo"
                                                    ? "bg-success-focus text-success-600 border border-success-main"
                                                    : matricula.cp_status_matricula === "cancelado"
                                                        ? "bg-danger-focus text-danger-600 border border-danger-main"
                                                        : matricula.cp_status_matricula === "trancado"
                                                            ? "bg-warning-focus text-warning-600 border border-warning-main"
                                                            : matricula.cp_status_matricula === "concluído"
                                                                ? "bg-primary-focus text-primary-600 border border-primary-main"
                                                                : "bg-neutral-200 text-neutral-600 border border-neutral-400"
                                                    } px-24 py-4 radius-4 fw-medium text-sm`}
                                            >
                                                {matricula.cp_status_matricula}
                                            </span>
                                        </td>
                                        <td>{`${matricula.cp_mt_parcelas_pagas}/${matricula.cp_mt_quantas_parcelas}`}</td>
                                        <td className="text-center">
                                            {/* <Link
                                                to="#"
                                                className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="iconamoon:eye-light" />
                                            </Link> */}
                                            <Link
                                                to={`/cadastro-matricula/${matricula.cp_mt_id}`}
                                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="lucide:edit" />
                                            </Link>

                                            <Link
                                                to="#"
                                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="mingcute:delete-2-line" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-24">
                    <span>
                        Mostrando {currentPage} de{" "}
                        {Math.ceil(filteredMatriculas.length / matriculasPerPage)} páginas
                    </span>
                    <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                <Icon icon="ep:d-arrow-left" />
                            </button>
                        </li>
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </button>
                        </li>
                        {Array.from(
                            {
                                length: Math.min(
                                    5,
                                    Math.ceil(filteredMatriculas.length / matriculasPerPage)
                                ),
                            },
                            (_, idx) => idx + Math.max(1, Math.min(currentPage - 2, Math.ceil(filteredMatriculas.length / matriculasPerPage) - 4))
                        ).map((page) => (
                            <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                <button
                                    className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${currentPage === page
                                        ? "bg-primary-600 text-white"
                                        : "bg-neutral-200 text-secondary-light"
                                        }`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}
                        {Math.ceil(filteredMatriculas.length / matriculasPerPage) > 5 &&
                            currentPage + 2 < Math.ceil(filteredMatriculas.length / matriculasPerPage) && (
                                <li className="page-item">
                                    <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                        ...
                                    </span>
                                </li>
                            )}
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(
                                            prev + 1,
                                            Math.ceil(filteredMatriculas.length / matriculasPerPage)
                                        )
                                    )
                                }
                                disabled={currentPage === Math.ceil(filteredMatriculas.length / matriculasPerPage)}
                            >
                                Próximo
                            </button>
                        </li>
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() => setCurrentPage(Math.ceil(filteredMatriculas.length / matriculasPerPage))}
                                disabled={currentPage === Math.ceil(filteredMatriculas.length / matriculasPerPage)}
                            >
                                <Icon icon="ep:d-arrow-right" />
                            </button>
                        </li>
                    </ul>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={currentPage}
                        onChange={(e) => {
                            setCurrentPage(Number(e.target.value));
                        }}
                    >
                        {Array.from(
                            { length: Math.ceil(filteredMatriculas.length / matriculasPerPage) },
                            (_, idx) => (
                                <option key={idx + 1} value={idx + 1}>
                                    Página {idx + 1}
                                </option>
                            )
                        )}
                    </select>

                </div>

            </div>
            {showModal && <></>}
        </div>
    );
};

export default Usuarios;
