import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js'
// import { Formik, Field, ErrorMessage } from 'formik';
import Axios from 'axios';
import { Spinner, Button } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { API_BASE_URL } from './config';
import Logo from './../img/frasePreta.png';
import PlanoDeFundo from './../img/gradiente.jpg'

const LoginTela = () => {
    const [loginError, setLoginError] = useState(false);
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);


    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            setIsLoggingIn(true);
            handleClickLogin({ login, password });
        }
    };


    const handleClickLogin = async (values) => {
        try {
            const response = await Axios.post(`${API_BASE_URL}/login`, values);
            console.log('Resposta recebida:', response.data);
            setIsLoggingIn(true);

            if (response.data.msg === 'Usuário Logado com sucesso') {
                // console.log('Entrou no if: Usuário Logado com sucesso');
                // Armazenar o tipo de usuário após o login bem-sucedido
                localStorage.setItem('userType', response.data.userType);
                localStorage.setItem('userName', response.data.userName);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('userProfilePhoto', response.data.userProfilePhoto);
                localStorage.setItem('schoolId', response.data.schoolId);
                localStorage.setItem('turmaID', response.data.turmaID);

                if (response.data.userType === 5) {
                    navigate('/home/');
                } else {
                    navigate('/home');
                }
            } else if (response.data.msg == 'Usuário ou senha incorretos') {
                // console.log('Entrou no else if: Usuário ou senha incorretos');
                toast.error(response.data.msg);
                setLoginError(true);
            } else {
                console.log('Entrou no else: Nenhum dos ifs foi atendido');
            }
        } catch (error) {
            if (error.response) {
                console.error('Erro de resposta do servidor:', error.response.data);
                console.error('Status do erro:', error.response.status);
                console.error('Cabeçalhos do erro:', error.response.headers);
            } else if (error.request) {
                console.error('Erro na requisição:', error.request);
            } else {
                console.error('Erro ao processar a requisição:', error.message);
            }
            // console.log('Entrou no catch');
            setIsLoggingIn(false);
            toast.error('Erro ao fazer login.');
        } finally {
            // console.log('Entrou no finally');
            // toast.error("Usuário ou senha incorretos");
            setIsLoggingIn(false);
        }
    };


    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Tela de carregamento inicial
    if (isPageLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </Spinner>
            </div>
        );
    }

    return (

        <>
            <ToastContainer />
            <section className="auth bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 w-auto justify-content-center">
                        <img src={PlanoDeFundo} alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                            }} />
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <Link to="/" className="mb-40 max-w-390-px">
                                <img src={Logo} alt="" />
                            </Link>
                            <h4 className="mb-12">Entre com sua conta</h4>
                            <p className="mb-32 text-secondary-light text-lg">
                                Bem-vindo de volta! Por favor, insira seus dados
                            </p>
                        </div>
                        <form action="#">
                            <div className="icon-field mb-16">
                                <span className="icon top-50 translate-middle-y">
                                    <Icon icon="mdi:account" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control h-56-px bg-neutral-50 radius-12"
                                    placeholder="Login"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                            </div>
                            <div className="position-relative mb-20">
                                <div className="icon-field">
                                    <span className="icon top-50 translate-middle-y">
                                        <Icon icon="solar:lock-password-outline" />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control h-56-px bg-neutral-50 radius-12"
                                        id="your-password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                </div>
                                {/* <span
                                    className="toggle-password cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
                                </span> */}
                            </div>
                            <div className="">
                                {/* <div className="d-flex justify-content-between gap-2">
                                    <div className="form-check style-check d-flex align-items-center">
                                        <input
                                            className="form-check-input border border-neutral-300"
                                            type="checkbox"
                                            defaultValue=""
                                            id="remeber"
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />

                                        <label className="form-check-label" htmlFor="remeber">
                                            Lembre de mim{" "}
                                        </label>
                                    </div>
                                    <Link to="#" className="text-primary-600 fw-medium">
                                        Esqueceu sua senha?
                                    </Link>
                                </div> */}
                            </div>
                            {/* <button
                                type="button"
                                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
                                onClick={() => handleClickLogin({ login, password })}
                            >
                                {" "}
                                Entrar
                                </button> */}

                            <button
                                type="button"
                                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
                                onClick={() => {
                                    setIsLoggingIn(true);
                                    handleClickLogin({ login, password });
                                }}
                                disabled={isLoggingIn}
                            >
                                {" "}
                                {isLoggingIn ? <Spinner animation="border" size="sm" /> : "Entrar"}
                            </button>

                            {/* <div className="mt-32 center-border-horizontal text-center">
                            <span className="bg-base z-1 px-4">Ou faça login com</span>
                        </div> */}
                            {/* <div className="mt-32 d-flex align-items-center gap-3">
                            <button
                                type="button"
                                className="fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50"
                            >
                                <Icon
                                    icon="ic:baseline-facebook"
                                    className="text-primary-600 text-xl line-height-1"
                                />
                                Google
                            </button>
                            <button
                                type="button"
                                className="fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50"
                            >
                                <Icon
                                    icon="logos:google-icon"
                                    className="text-primary-600 text-xl line-height-1"
                                />
                                Google
                            </button>
                        </div> */}
                            {/* <div className="mt-32 text-center text-sm">
                            <p className="mb-0">
                                Não tem uma conta?{" "}
                                <Link to="/sign-up" className="text-primary-600 fw-semibold">
                                    Inscrever-se
                                </Link>
                            </p>
                        </div> */}
                        </form>
                    </div>
                </div>
            </section>
        </>

    )
}

export default LoginTela