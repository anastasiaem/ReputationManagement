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

;; Report user behavior and update reputation
(define-public (report-interaction
    (user principal)
    (score uint)
    (action-type (string-ascii 20)))
    (let
        (
            (dapp-info (unwrap! (map-get? DAppRegistry tx-sender) ERR_DAPP_NOT_REGISTERED))
            (current-time (get-block-info? time (- block-height u1)))
        )
        (asserts! (and (>= score MIN_SCORE) (<= score MAX_SCORE)) ERR_INVALID_SCORE)
        (asserts! (get is-active dapp-info) ERR_DAPP_NOT_REGISTERED)

        ;; Record the interaction
        (map-set Interactions
            {user: user, dapp: tx-sender}
            {
                score: score,
                timestamp: (default-to u0 current-time),
                action-type: action-type
            }
        )

        ;; Update user's total score
        (update-user-score user score (get weight dapp-info))
        (ok true)
    )
)

;; Get user's current reputation score
(define-read-only (get-user-score (user principal))
    (default-to
        {total-score: INITIAL_SCORE, interaction-count: u0, last-updated: u0}
        (map-get? UserScores user)
    )
)

;; Private Functions

;; Update user's reputation score
(define-private (update-user-score (user principal) (new-score uint) (weight uint))
    (let
        (
            (current-data (get-user-score user))
            (current-count (get interaction-count current-data))
            (weighted-score (* new-score weight))
        )
        (map-set UserScores
            user
            {
                total-score: (calculate-new-score
                    (get total-score current-data)
                    weighted-score
                    current-count
                ),
                interaction-count: (+ current-count u1),
                last-updated: (default-to u0 (get-block-info? time (- block-height u1)))
            }
        )
    )
)

;; Calculate new weighted score
(define-private (calculate-new-score (old-score uint) (new-weighted-score uint) (count uint))
    (if (is-eq count u0)
        new-weighted-score
        (/ (+ (* old-score count) new-weighted-score) (+ count u1))
    )
)

;; Check if caller is contract owner
(define-private (is-contract-owner (caller principal))
    (is-eq caller CONTRACT_OWNER)
)
