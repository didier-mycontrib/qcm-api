pipeline {
    agent {
        docker {
		 image 'node:22'  
		}
    }
    environment{
	    //NB: credential_dockerhub_didierdefrance69 is ID of credential
		//prepared in "Admin Jenkins / Credentials / system /global"
		dockerhub_credential_id='credential_dockerhub_didierdefrance69'
		
		//dockerRegistry is dockerhub
		docker_registry= 'https://registry.hub.docker.com'
		
		docker_image_name='didierdefrance69/qcm_api:1'
	}

    stages {
     //stage('from_git') { 
      // steps { git url : 'https://github.com/didier-mycontrib/qcm-api.git' , branch : 'main' 
     //} 
    //}
    stage('npm_install') { 
      steps {
       sh 'npm install' 
     } 
    }
      stage('Test') {
            steps {
                echo 'lancement de tests unitaires et integration '
				sh export TEST_MODE='IT'
                sh 'npm run test'

            }
        }
	stage('build_docker_image') {
	     steps {
		     script{ 
			      dockerImage = docker.build(docker_image_name)
			    }
		    } 
		}
	stage('push_docker_image') {
            steps {
			  script{
					echo "docker_registry=" + docker_registry
					echo "dockerhub_credential_id=" +dockerhub_credential_id
					docker.withRegistry( docker_registry, dockerhub_credential_id ) { 
					     dockerImage.push() 
						 }
					  }
				  }
		}
    }
}
