;; Reputation Management System
;; Tracks user reputation across multiple DApps on Stacks blockchain

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant MIN_SCORE u0)
(define-constant MAX_SCORE u100)
(define-constant INITIAL_SCORE u50)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_SCORE (err u101))
(define-constant ERR_DAPP_NOT_REGISTERED (err u102))

;; Data Maps
(define-map UserScores
    principal
    {
        total-score: uint,
        interaction-count: uint,
        last-updated: uint
    }
)

(define-map DAppRegistry
    principal
    {
        name: (string-ascii 50),
        weight: uint,
        is-active: bool
    }
)

(define-map Interactions
    {user: principal, dapp: principal}
    {
        score: uint,
        timestamp: uint,
        action-type: (string-ascii 20)
    }
)

;; Public Functions

;; Register a new DApp
(define-public (register-dapp (dapp-name (string-ascii 50)) (weight uint))
    (begin
        (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
        (ok (map-set DAppRegistry
            tx-sender
            {
                name: dapp-name,
                weight: weight,
                is-active: true
            }
        ))
    )
)
