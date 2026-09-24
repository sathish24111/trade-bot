package com.tradepilot.data.remote

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.IOException
import java.util.concurrent.TimeUnit

class HostFallbackInterceptor : Interceptor {
    private var workingHost: String? = null

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val originalHttpUrl = request.url

        val hostsToTry = if (workingHost != null) {
            listOf(workingHost!!) + ApiConfig.candidateHosts.filter { it != workingHost }
        } else {
            ApiConfig.candidateHosts
        }

        var lastException: IOException? = null
        for (host in hostsToTry) {
            try {
                val newUrl = originalHttpUrl.newBuilder()
                    .host(host)
                    .port(5000)
                    .build()
                val newRequest = request.newBuilder()
                    .url(newUrl)
                    .build()
                val response = chain.proceed(newRequest)
                if (response.isSuccessful || response.code in 200..499) {
                    workingHost = host
                    ApiConfig.wsUrl = "ws://$host:5000/ws"
                    return response
                }
            } catch (e: IOException) {
                lastException = e
            }
        }
        throw lastException ?: IOException("Failed to connect to backend server")
    }
}

class ApiClient(val authInterceptor: AuthInterceptor = AuthInterceptor()) {

    val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(HostFallbackInterceptor())
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .writeTimeout(8, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    val apiService: ApiService = Retrofit.Builder()
        .baseUrl(ApiConfig.baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ApiService::class.java)

    fun updateToken(token: String?) {
        authInterceptor.authToken = token
    }

    companion object {
        val instance: ApiClient by lazy { ApiClient() }
        val apiService: ApiService get() = instance.apiService
    }
}
