# Secure DevSecOps Platform — Web Pentest & Automatisation CI/CD

## 1. Présentation du projet

Ce projet consiste à concevoir et mettre en place une plateforme **DevSecOps** permettant d'intégrer les pratiques de sécurité tout au long du cycle de développement et de déploiement d'une application web.

L'objectif est de sécuriser une application web conteneurisée en combinant les tests de sécurité automatisés, les pratiques de développement sécurisé et les tests d'intrusion (*Web Penetration Testing*).

L'automatisation repose sur **GitLab CI/CD**, qui permet d'exécuter différentes analyses de sécurité à chaque modification du code source, afin de détecter les vulnérabilités le plus tôt possible.

## 2. Architecture de l'application

L'application étudiée repose sur une architecture composée des technologies suivantes :

| Composant | Technologie | Rôle |
|---|---|---|
| Frontend | Angular | Interface utilisateur |
| Backend | FastAPI | API et logique métier |
| Base de données | PostgreSQL | Stockage des données |
| Reverse Proxy | Nginx | Routage et gestion des requêtes HTTP |
| Conteneurisation | Docker | Isolation et déploiement des composants |
| Orchestration | Docker Compose | Gestion des conteneurs |
| CI/CD | GitLab CI/CD | Automatisation du cycle de développement |

## 3. Outils de sécurité intégrés

Le projet s'appuie sur plusieurs outils complémentaires permettant de couvrir différents aspects de la sécurité.

| Domaine | Outil | Objectif |
|---|---|---|
| SAST | Semgrep | Analyse statique du code source |
| Secret Scanning | Gitleaks | Détection des mots de passe, clés API et secrets exposés |
| Container Security | Trivy | Détection des vulnérabilités dans les images Docker |
| IaC Security | Checkov | Analyse de la sécurité des fichiers d'infrastructure |
| DAST | OWASP ZAP | Analyse dynamique de l'application en fonctionnement |

## 4. Fonctionnement du pipeline CI/CD

Le pipeline GitLab CI/CD automatise progressivement les différentes opérations de sécurité.

Les étapes prévues sont :

1. **Secret Scanning :** recherche des informations sensibles exposées dans le dépôt Git.
2. **SAST :** analyse du code source Angular et FastAPI.
3. **IaC Security :** vérification des configurations Docker et Docker Compose.
4. **Build :** construction des images Docker de l'application.
5. **Container Security :** analyse des images Docker à la recherche de vulnérabilités connues.
6. **Deployment :** déploiement de l'application dans un environnement de test.
7. **DAST :** analyse dynamique de l'application à l'aide d'OWASP ZAP.
8. **Security Gates :** application de règles de sécurité permettant de contrôler le passage aux étapes suivantes du pipeline.

Les résultats des analyses sont conservés sous forme de rapports afin de faciliter l'identification, le suivi et la correction des vulnérabilités.

## 5. Phases de réalisation

Le projet est organisé en plusieurs phases progressives :

| Phase | Description |
|---|---|
| Phase 1 | Préparation de l'application et du dépôt GitLab |
| Phase 2 | Configuration de GitLab Runner et du pipeline CI/CD de base |
| Phase 3 | Intégration de Semgrep et Gitleaks |
| Phase 4 | Intégration de Checkov et Trivy |
| Phase 5 | Déploiement de l'application dans un environnement de test |
| Phase 6 | Intégration d'OWASP ZAP et réalisation des tests d'intrusion |
| Phase 7 | Mise en place des règles de sécurité et des rapports de vulnérabilités |
| Phase 8 | Correction des vulnérabilités et validation du pipeline sécurisé |

## 6. Résultats attendus

À travers ce projet, les résultats attendus sont :

- Automatiser la détection des vulnérabilités dans le code source et l'infrastructure.
- Renforcer la sécurité des conteneurs Docker.
- Identifier les mauvaises configurations et les secrets exposés.
- Réaliser des tests de sécurité sur l'application web en fonctionnement.
- Intégrer des contrôles de sécurité dans le processus CI/CD.
- Empêcher, selon des règles définies, le déploiement de versions présentant des vulnérabilités critiques.
- Produire des rapports permettant de suivre les vulnérabilités et leur correction.

## 7. Objectif final

L'objectif final est de disposer d'une plateforme DevSecOps fonctionnelle qui démontre comment intégrer la sécurité dans l'ensemble du cycle de développement logiciel (*Security by Design*), depuis l'écriture du code jusqu'au déploiement de l'application.

Le projet vise ainsi à mettre en pratique les principes du DevSecOps en associant automatisation CI/CD, sécurité des applications web, sécurité des conteneurs et tests d'intrusion.
