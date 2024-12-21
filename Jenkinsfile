pipeline {
  agent any

  stages {
    
    stage('Installing Packages') {
      steps {
        script {
          sh 'yarn install'
        }
      }
    }

    stage('Build') {
      steps {
        script {
          sh 'yarn run build'
          sh 'cp ./src/public.key ./build/public.key'
        }
      }
    }

     stage('Copying keys') {
      steps {
        script {
          sh 'cp ./src/public.key ./build/public.key'
        }
      }
    }

    stage('deploy') {
      steps {
        script {
          sh 'chmod +x ./script/deploy.sh'
          sh './script/deploy.sh'
        }
      }
    }
  }
}