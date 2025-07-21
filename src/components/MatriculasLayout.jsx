import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import { API_BASE_URL } from "./config";
import DeleteModal from "./components/DeleteModal"; // Certifique-se de que o caminho está correto

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [matriculaToDelete, setMatriculaToDelete] = useState(null);
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchMatriculas();
    }, []);

    const fetchMatriculas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/matriculas`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            const data = await response.json();

            // Garantir que data seja sempre um array
            const matriculasArray = Array.isArray(data) ? data : [];

            // Filtrar por escola se necessário
            const userType = parseInt(localStorage.getItem('userType'), 10) || 0;
            const schoolId = localStorage.getItem("schoolId");
            const userId = parseInt(localStorage.getItem("userId"), 10) || 0;

            let matriculasFiltradas = matriculasArray;

            // Filtrar por escola para usuários que não são super admin
            if (userType !== 1 && schoolId) {
                matriculasFiltradas = matriculasArray.filter(matricula =>
                    matricula.cp_mt_escola_id == schoolId
                );
            }

            // Se for aluno (userType 5), mostrar apenas suas próprias matrículas
            if (userType === 5) {
                matriculasFiltradas = matriculasFiltradas.filter(matricula =>
                    matricula.cp_mt_usuario_id === userId
                );
            }

            setMatriculas(matriculasFiltradas);
        } catch (error) {
            console.error("Erro ao buscar matrículas:", error);
            setMatriculas([]); // Definir como array vazio em caso de erro
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (matricula) => {
        setMatriculaToDelete(matricula);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("Token não encontrado");
                navigate('/');
                return;
            }

            await axios.delete(`${API_BASE_URL}/matriculas/${matriculaToDelete.cp_mt_id}`, { // Use cp_mt_id here
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchMatriculas(); // Recarregar lista
            setShowDeleteModal(false);
            setMatriculaToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir matrícula:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate('/');
            }
        }
    };

    const closeModal = () => {
        setShowDeleteModal(false);
        setMatriculaToDelete(null);
    };


    const openEditModal = (matriculaId) => {
        const matricula = matriculas.find((m) => m.cp_mt_id === matriculaId);
        setMatriculaDataToEdit(matricula);
        setShowModal(true);
    };

    const closeModalEdit = () => {
        setShowModal(false);
        fetchMatriculas();
    };

    const filteredMatriculas = matriculas.filter((matricula) => {
        const nomeUsuario = matricula.nome_usuario?.toLowerCase() || "";

        const statusMatches = !statusFilter || matricula.cp_status?.toLowerCase() === statusFilter.toLowerCase();

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
                                        <td>{matricula.nome_usuario}</td>
                                        <td className="text-left">
                                            <span
                                                className={`badge ${matricula.cp_status === "ativo"
                                                    ? "bg-success-focus text-success-600 border border-success-main"
                                                    : matricula.cp_status === "cancelado"
                                                        ? "bg-danger-focus text-danger-600 border border-danger-main"
                                                        : matricula.cp_status === "trancado"
                                                            ? "bg-warning-focus text-warning-600 border border-warning-main"
                                                            : matricula.cp_status === "concluido"
                                                                ? "bg-primary-600 text-white border border-primary-main"
                                                                : "bg-neutral-200 text-neutral-600 border border-neutral-400"
                                                    } px-24 py-4 radius-4 fw-medium text-sm`}
                                            >
                                                {matricula.cp_status}
                                            </span>
                                        </td>
                                        <td>{`${matricula.cp_mt_parcelas_pagas || 0}/${matricula.cp_mt_quantas_parcelas || 0}`}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/cadastro-matricula/${matricula.cp_mt_id}`}
                                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="lucide:edit" />
                                            </Link>

                                            <Link
                                                to="#"
                                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                onClick={() => handleDelete(matricula)}
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
             {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onClose={closeModal}
                    onConfirm={confirmDelete}
                    itemName="matrícula"
                />
            )}
            {showModal && <></>}
        </div>
    );
};

export default Usuarios;