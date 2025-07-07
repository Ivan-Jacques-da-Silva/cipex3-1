import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

const Usuarios = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [userDataToEdit, setUserDataToEdit] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUserType, setSelectedUserType] = useState("");
    const [showOnlyBirthdays, setShowOnlyBirthdays] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        try {
            await fetch(`${API_BASE_URL}/delete-user/${userId}`, {
                method: "DELETE",
            });
            fetchUsers();
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
        }
    };

    const openEditModal = (user) => {
        setUserDataToEdit(user);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        fetchUsers();
    };

    // Coloque a função aqui, antes do uso em filteredUsers
    const isBirthdaySoon = (dateOfBirth) => {
        const today = new Date();
        const [year, month, day] = dateOfBirth.split("T")[0].split("-").map(Number);

        // Resetando horas, minutos, segundos para comparação apenas da data
        const todayOnlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const birthDateThisYear = new Date(today.getFullYear(), month - 1, day);

        const diffTime = Math.abs(birthDateThisYear - todayOnlyDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 5 && birthDateThisYear >= todayOnlyDate;
    };

    const mapUserType = (type) => {
        switch (type) {
            case 1:
                return "Gestor";
            case 2:
                return "Diretor";
            case 3:
                return "Secretário(a)";
            case 4:
                return "Professor";
            case 5:
                return "Aluno";
            default:
                return "Outro";
        }
    };

    // Certifique-se de que o filteredUsers só seja calculado após a função estar definida
    const schoolId = Number(localStorage.getItem("schoolId"));
    const userType = Number(localStorage.getItem("userType"));

    const filteredUsers = users.filter((user) => {
        const isAdmin = userType === 1; // Se userType for 1, pode ver todos os usuários
        const matchesSchool = isAdmin || user.cp_escola_id === schoolId; // Admin vê todos, outros só da escola
        const notDeleted = user.cp_excluido !== 1; // Não exibir usuários excluídos
        const matchesSearch = user.cp_nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedUserType || mapUserType(user.cp_tipo_user) === selectedUserType;
        const matchesBirthday = !showOnlyBirthdays || isBirthdaySoon(user.cp_datanascimento);

        return matchesSchool && notDeleted && matchesSearch && matchesType && matchesBirthday;
    });



    const totalPaginas = Math.ceil(filteredUsers.length / usersPerPage);

    const paginasVisiveis = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPaginas, currentPage + 2); i++) {
        paginasVisiveis.push(i);
    }

    const currentUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
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
                        value={usersPerPage}
                        onChange={(e) => {
                            setUsersPerPage(Number(e.target.value));
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
                            placeholder="Pesquisar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon icon="ion:search-outline" className="icon" />
                    </form>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                    >
                        <option value="">Todos os tipos</option>
                        <option value="Gestor">Gestor</option>
                        <option value="Diretor">Diretor</option>
                        <option value="Secretário(a)">Secretário(a)</option>
                        <option value="Professor">Professor</option>
                        <option value="Aluno">Aluno</option>
                    </select>

                    <button
                        className="btn btn-outline-secondary text-md py-6 radius-12 h-40-px d-flex align-items-center gap-2"
                        onClick={() => setShowOnlyBirthdays(!showOnlyBirthdays)}
                    >
                        <Icon icon="fa-solid:gift" className="text-primary" /> Aniversariantes
                    </button>
                </div>
                <Link
                    to="/cadastro-usuario"
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
                                <th>Nome</th>
                                <th>Data de Nascimento</th>
                                <th>Tipo</th>
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
                                currentUsers.map((user) => (
                                    <tr key={user.cp_id}>
                                        <td>
                                            {user.cp_nome}{" "}
                                            {isBirthdaySoon(user.cp_datanascimento) && (
                                                <Icon icon="fa-solid:gift" className="text-primary ms-2" />
                                            )}
                                        </td>
                                        <td>{new Date(user.cp_datanascimento).toLocaleDateString()}</td>
                                        <td>{mapUserType(user.cp_tipo_user)}</td>
                                        <td className="text-center">
                                            {/* <Link
                                                to="#"
                                                className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="iconamoon:eye-light" />
                                            </Link> */}
                                            <Link
                                                to={`/cadastro-usuario/${user.cp_id}`}
                                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="lucide:edit" />
                                            </Link>
                                            <Link
                                                to="#"
                                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                onClick={() => handleDelete(user.cp_id)}
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
                        Mostrando {currentPage} de {totalPaginas} páginas
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
                        {paginasVisiveis.map((page) => (
                            <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                <button
                                    className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${currentPage === page ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}
                        {totalPaginas > 5 && currentPage + 2 < totalPaginas && (
                            <li className="page-item">
                                <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                    ...
                                </span>
                            </li>
                        )}
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
                                disabled={currentPage === totalPaginas}
                            >
                                Próximo
                            </button>
                        </li>
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                onClick={() => setCurrentPage(totalPaginas)}
                                disabled={currentPage === totalPaginas}
                            >
                                <Icon icon="ep:d-arrow-right" />
                            </button>
                        </li>
                    </ul>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                    >
                        {Array.from({ length: totalPaginas }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                                Página {idx + 1}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {showModal && <></>}
        </div>
    );
};

export default Usuarios;
