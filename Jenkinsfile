def app

pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Code quality') {
            agent {
                    docker {
                        image 'timbru31/java-node:8-slim-jre'
                    }
            }
            environment {
               HOME = '.'
            }
            steps {
                script {
                    sh "npm ci --production"
                }
                dependencyCheck additionalArguments: '''
                    -o "./"
                    -s "./"
                    -f "JSON"
                    -f "HTML"
                    -f "XML"
                    --prettyPrint
                ''', odcInstallation: 'DependencyCheck 6.0'
                //dependencyCheckPublisher pattern: 'dependency-check-report.html'
                withSonarQubeEnv('korti.io') {
                    script {
                        def scannerHome = tool 'SonarScanner 4.5'
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Build image') {
            steps {
                script {
                    app = docker.build('korti11/invi-me-bot/invi-me-bot:dev')
                }
            }
        }

        stage('Push image') {
            steps {
                script {
                    if(env.BRANCH_NAME == "release") {
                        def packageJson = readJSON file: 'package.json'

                        docker.withRegistry("https://docker.pkg.github.com", "github") {
                            app.push("${packageJson.version}");
                            app.push("latest")
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}