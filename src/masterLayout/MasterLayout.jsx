import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { API_BASE_URL } from './../components/config';
import logoPreo from './../img/logoPreto.png';
import logoBranco from './../img/logo.png'
import logoBrancoFavicon from './../img/FaviconPreto.png'
import logoPretoFavicon from './../img/FaviconBranco.png'

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation(); // Hook to get the current route
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const permissoesMenu = {
    "gestao": [1, 2, 3],   // Somente tipos 1, 2 e 3 podem ver
    "direcao": [1, 2],     // Somente tipos 1 e 2 podem ver
    "secretaria": [3],     // Somente tipo 3 pode ver
    "professor": [4],      // Somente tipo 4 pode ver
    "aluno": [5],          // Somente tipo 5 pode ver
    "admin": [1],          // Somente tipo 1 pode ver
  };

  const userType = parseInt(localStorage.getItem('userType'), 10) || 0;

  // Função para verificar permissão
  const temPermissao = (categoria) => {
    return permissoesMenu[categoria]?.includes(userType);
  };



  useEffect(() => {
    // Function to handle dropdown clicks
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest('.dropdown');

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains('open');

      // Close all dropdowns
      const allDropdowns = document.querySelectorAll('.sidebar-menu .dropdown');
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove('open');
      });

      // Toggle the clicked dropdown
      if (!isActive) {
        clickedDropdown.classList.add('open');
      }
    };

    // Attach click event listeners to all dropdown triggers
    const dropdownTriggers = document.querySelectorAll('.sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link');

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener('click', handleDropdownClick);
    });

    // Function to open submenu based on current route
    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll('.sidebar-menu .dropdown');
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll('.sidebar-submenu li a');
        submenuLinks.forEach((link) => {
          if (link.getAttribute('href') === location.pathname || link.getAttribute('to') === location.pathname) {
            dropdown.classList.add('open');
          }
        });
      });
    };

    // Open the submenu that contains the open route
    openActiveDropdown();



    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener('click', handleDropdownClick);
      });

    };
  }, [location.pathname]);


  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'light');

    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [theme]);






  const handleLogout = () => {
    // Limpar o localStorage ao clicar em "Sair"
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfilePhoto');
    localStorage.removeItem('schoolId');
    localStorage.removeItem('turmaID');

    // Redirecionar para a página inicial ("/")
    console.log("Chegou no sair")
    navigate('/');
  };


  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>

      <aside className={sidebarActive ? "sidebar active " : mobileMenu ? "sidebar sidebar-open" : "sidebar"}>
        <button onClick={mobileMenuControl} type="button" className="sidebar-close-btn">
          <Icon icon="radix-icons:cross-2" />
        </button>
        <div>
          <Link to="/home" className="sidebar-logo">
            <img
              src={logoPreo}
              alt="site logo"
              className="light-logo"
            />
            <img
              src={logoBranco}
              alt="site logo"
              className="dark-logo"
            />


            <img
              src={theme === 'dark' ? logoPretoFavicon : logoBrancoFavicon}
              alt="site logo"
              className="logo-icon"
            />
          </Link>
        </div>
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            <li>
              <NavLink to="/home" className={(navData) =>
                navData.isActive ? "active-page" : ""
              }>
                <Icon icon="solar:home-smile-angle-outline" className="menu-icon" />
                <span>Home</span>
              </NavLink>
            </li>

            {temPermissao("gestao") && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="heroicons:document" className="menu-icon" />
                  <span>Cadastros</span>
                </Link>
                <ul className="sidebar-submenu">
                  <li>
                    <NavLink to="/cadastro-usuario" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-primary-600 w-auto" /> Cadastro de Usuário
                    </NavLink>
                  </li>
                  {temPermissao("direcao") && (
                    <li>
                      <NavLink to="/cadastro-escola" className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }>
                        <i className="ri-circle-fill circle-icon text-warning-main w-auto" /> Cadastro de Escola
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink to="/cadastro-turma" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-success-main w-auto" /> Cadastro de Turma
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/cadastro-matricula" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-danger-main w-auto" /> Cadastro de Matrícula
                    </NavLink>
                  </li>
                  {temPermissao("direcao") && (
                    <li>
                      <NavLink to="/cadastro-audio" className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }>
                        <i className="ri-circle-fill circle-icon text-info w-auto" /> Cadastro de Áudio
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )}

            <li className="sidebar-menu-group-title">Gestão</li>
            <li className="dropdown">
              <Link to="#">
                <Icon icon="solar:document-text-outline" className="menu-icon" />
                <span>Controle Educacional</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  {temPermissao("gestao") && (
                    <NavLink to="/usuarios" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-info w-auto" /> Usuários
                    </NavLink>
                  )}
                </li>
                <li>
                  {temPermissao("gestao") && (
                    <NavLink to="/matriculas" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-danger-main w-auto" /> Matrículas
                    </NavLink>
                  )}
                </li>
                <li>
                  <NavLink to="/turmas" className={(navData) =>
                    navData.isActive ? "active-page" : ""
                  }>
                    <i className="ri-circle-fill circle-icon text-success-main w-auto" /> Turmas
                  </NavLink>
                </li>
                <li>
                  {temPermissao("direcao") && (
                    <NavLink to="/escolas" className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }>
                      <i className="ri-circle-fill circle-icon text-orange w-auto" /> Escolas
                    </NavLink>
                  )}
                </li>
              </ul>
            </li>
            {temPermissao("gestao") && (
              <li>
                <NavLink to="/financeiro" className={(navData) =>
                  navData.isActive ? "active-page" : ""
                }>
                  <Icon icon="hugeicons:money-send-square" className="menu-icon" />
                  <span>Financeiro</span>
                </NavLink>
              </li>
            )}
            {(temPermissao("gestao") || temPermissao("professor")) && (
              <li className="sidebar-menu-group-title">Material</li>
            )}
           {(temPermissao("gestao") || temPermissao("professor")) && (
              <li>
                <NavLink to="/audios" className={(navData) =>
                  navData.isActive ? "active-page" : ""
                }>
                  <Icon icon="ph:music-note-simple" className="menu-icon" />

                  <span> Áudios</span>
                </NavLink>
              </li>
            )}
              {(temPermissao("direcao") || temPermissao("professor")) && (
              <>
                <li>
                  <NavLink to="/treinamento" className={(navData) =>
                    navData.isActive ? "active-page" : ""
                  }>
                    <Icon icon="ph:chalkboard-teacher" className="menu-icon" />

                    <span> Treinamento</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/material-extra" className={(navData) =>
                    navData.isActive ? "active-page" : ""
                  }>
                    <Icon icon="ph:books" className="menu-icon" />
                    <span> Material Extra</span>
                  </NavLink>
                </li>
              </>
            )}

            {temPermissao("professor") || temPermissao("aluno") ? (
              <>
                <li className="sidebar-menu-group-title">Aula</li>
                <li>
                  <NavLink
                    to={localStorage.getItem("userType") === "5" ? "/sala-de-aula-aluno" : "/sala-de-aula"}
                    className={(navData) => (navData.isActive ? "active-page" : "")}
                  >
                    <Icon icon="ph:chalkboard-teacher" className="menu-icon" />
                    <span>Sala de Aula</span>
                  </NavLink>
                </li>
              </>
            ) : null}

            <li>
              <NavLink to="/agenda" className={(navData) =>
                navData.isActive ? "active-page" : ""
              }>
                <Icon icon="solar:calendar-outline" className="menu-icon" />
                <span>Agenda</span>
              </NavLink>
            </li>


          </ul>
        </div>
      </aside>



      <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button type="button" className="sidebar-toggle" onClick={sidebarControl}>
                  {
                    sidebarActive ? (<Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />) : (<Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active "
                    />)
                  }
                </button>
                <button onClick={mobileMenuControl} type="button" className="sidebar-mobile-toggle">
                  <Icon
                    icon="heroicons:bars-3-solid"
                    className="icon"
                  />
                </button>

              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">

                <ThemeToggleButton />

                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src={
                        localStorage.getItem("userProfilePhoto")
                          ? `${API_BASE_URL}/${localStorage.getItem("userProfilePhoto")}`
                          : "assets/images/user.png"
                      }
                      alt="image_user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">
                          {localStorage.getItem("userName") || "Usuário"}
                        </h6>
                        <span className="text-secondary-light fw-medium text-sm">
                          {(() => {
                            const userType = localStorage.getItem("userType");
                            switch (userType) {
                              case "1":
                                return "Gestor";
                              case "2":
                                return "Diretor";
                              case "3":
                                return "Secretário(a)";
                              case "4":
                                return "Professor";
                              case "5":
                                return "Aluno";
                              default:
                                return "Desconhecido";
                            }
                          })()}
                        </span>
                      </div>
                      <button type="button" className="hover-text-danger">
                        <Icon icon="radix-icons:cross-1" className="icon text-xl" />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          // to="/view-profile"
                          to="#"
                        >
                          <Icon icon="solar:user-linear" className="icon text-xl" /> Meu Perfil
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          // to="/email"
                          to="#"
                        >
                          <Icon icon="tabler:message-check" className="icon text-xl" />{" "}
                          Caixa de Entrada
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3"
                          // to="/company"
                          to="#"
                        >
                          <Icon icon="icon-park-outline:setting-two" className="icon text-xl" />
                          Configurações
                        </Link>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          onClick={handleLogout}
                        >
                          <Icon icon="lucide:power" className="icon text-xl" /> Sair
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>



              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-body">{children}</div>


        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© 2025 CIPEX. Todos os direitos reservados.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Desenvolvido por <span className="text-primary-600">Vision</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
