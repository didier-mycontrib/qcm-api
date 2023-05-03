pipeline {
    agent any

    stages {
        stage('Hello') {
            steps {
                echo 'Hello World from qcm_api'
            }
		}
		stage('Checkout code') {
			steps {
			   ws("/docker-contents/qcm-api") {
				  checkout scm
			   }
			}
		}
		stage('recompose docker container') {
			steps {
			    ws("/conf-docker/backend-qcm") {
				     sh('date > lastUpdate.txt')
				}
			}
		}
    }
}
