
import React from 'react';
import { Icon } from "@iconify/react";

const DeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content radius-16 bg-base">
                    <div className="modal-body p-24 text-center">
                        <span className="mb-16 fs-1 line-height-1 text-danger">
                            <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                        </span>
                        <h6 className="text-lg fw-semibold text-primary-light mb-8">
                            Confirmar Exclusão
                        </h6>
                        <p className="text-secondary-light mb-0">
                            Tem certeza que deseja excluir esta {itemName}? Esta ação não pode ser desfeita.
                        </p>
                        <div className="d-flex align-items-center justify-content-center gap-3 mt-24">
                            <button
                                type="button"
                                className="btn btn-outline-secondary border border-secondary-300 text-secondary-light text-md px-40 py-11 radius-8"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger text-md px-40 py-11 radius-8"
                                onClick={onConfirm}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
